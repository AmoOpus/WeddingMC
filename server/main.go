// Command andrewmo-mc-server server-side renders the Andrew Mo wedding MC
// landing page, serves its static assets, and emails contact-form
// submissions to the configured recipient.
//
// Standard library only — no external dependencies, no `go mod download`
// required. Build with:
//
//	go build -o server .
//	./server
//
// Configuration is via environment variables (see .env.example).
package main

import (
	"embed"
	"encoding/json"
	"fmt"
	"html/template"
	"io/fs"
	"log"
	"net/http"
	"net/smtp"
	"os"
	"strconv"
	"strings"
)

//go:embed templates/*.gohtml
var templateFS embed.FS

//go:embed static
var staticFSRaw embed.FS

//go:embed testimonials.json
var testimonialsJSON []byte

// Testimonial mirrors testimonials.json / the client-side FALLBACK_TESTIMONIALS
// in static/script.js. Keep all three in sync when editing reviews.
type Testimonial struct {
	ID     string `json:"id"`
	Image  string `json:"image"`
	Look   string `json:"look"`
	Alt    string `json:"alt"`
	Quote  string `json:"quote"`
	Author string `json:"author"`
	Rating int    `json:"rating"`
}

// StarsHTML renders the ★/☆ rating as ready-to-use HTML, matching the
// starString() helper in static/script.js.
func (t Testimonial) StarsHTML() template.HTML {
	var sb strings.Builder
	for i := 0; i < 5; i++ {
		if i < t.Rating {
			sb.WriteString(`<span class="star-filled">&#9733;</span>`)
		} else {
			sb.WriteString(`<span class="star-empty">&#9734;</span>`)
		}
	}
	return template.HTML(sb.String())
}

// PageData is everything the template needs to render the page and its
// JSON-LD structured data.
type PageData struct {
	SiteURL      string
	Testimonials []Testimonial
	AvgRating    string
	ReviewCount  int
}

var (
	pageTemplate *template.Template
	testimonials []Testimonial
	siteURL      string
)

func main() {
	siteURL = strings.TrimRight(getenv("SITE_URL", "http://localhost:8080"), "/")

	var err error
	pageTemplate, err = template.ParseFS(templateFS, "templates/index.gohtml")
	if err != nil {
		log.Fatalf("parsing template: %v", err)
	}

	if err := json.Unmarshal(testimonialsJSON, &testimonials); err != nil {
		log.Fatalf("parsing testimonials.json: %v", err)
	}

	staticSub, err := fs.Sub(staticFSRaw, "static")
	if err != nil {
		log.Fatalf("preparing static assets: %v", err)
	}
	assetsSub, err := fs.Sub(staticFSRaw, "static/assets")
	if err != nil {
		log.Fatalf("preparing image assets: %v", err)
	}

	mux := http.NewServeMux()
	mux.HandleFunc("/", handleHome)
	mux.HandleFunc("/contact", handleContact)
	mux.HandleFunc("/robots.txt", handleRobots)
	mux.HandleFunc("/sitemap.xml", handleSitemap)
	mux.Handle("/static/", http.StripPrefix("/static/", http.FileServer(http.FS(staticSub))))
	// The shared client-side script.js (also used by the static GitHub
	// Pages build) fetches testimonials.json and then builds <img> tags
	// using page-root-relative paths like "assets/images/mc-1.jpg". Serve
	// the same images at /assets/ (in addition to /static/assets/, which
	// the server-rendered template itself uses) so both resolve correctly.
	mux.Handle("/assets/", http.StripPrefix("/assets/", http.FileServer(http.FS(assetsSub))))
	// testimonials.json is also served at the root path for parity with the
	// static (GitHub Pages) build's client-side fetch fallback.
	mux.HandleFunc("/testimonials.json", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json; charset=utf-8")
		w.Write(testimonialsJSON)
	})

	addr := ":" + getenv("PORT", "8080")
	log.Printf("Andrew Mo MC server listening on %s (SITE_URL=%s)", addr, siteURL)
	log.Fatal(http.ListenAndServe(addr, mux))
}

func handleHome(w http.ResponseWriter, r *http.Request) {
	if r.URL.Path != "/" {
		http.NotFound(w, r)
		return
	}

	sum, count := 0, len(testimonials)
	for _, t := range testimonials {
		sum += t.Rating
	}
	avg := "5"
	if count > 0 {
		avg = strconv.FormatFloat(float64(sum)/float64(count), 'f', -1, 64)
	}

	data := PageData{
		SiteURL:      siteURL,
		Testimonials: testimonials,
		AvgRating:    avg,
		ReviewCount:  count,
	}

	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	if err := pageTemplate.Execute(w, data); err != nil {
		log.Printf("template execute error: %v", err)
		http.Error(w, "internal server error", http.StatusInternalServerError)
	}
}

func handleRobots(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "text/plain; charset=utf-8")
	fmt.Fprintf(w, "User-agent: *\nAllow: /\n\nSitemap: %s/sitemap.xml\n", siteURL)
}

func handleSitemap(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/xml; charset=utf-8")
	fmt.Fprintf(w, `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>%s/</loc>
    <changefreq>monthly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
`, siteURL)
}

// handleContact receives the enquiry form (submitted via the page's own
// fetch() call as multipart/form-data, or as a plain form POST if
// JavaScript is unavailable) and emails it to CONTACT_TO_EMAIL.
func handleContact(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// r.FormValue parses both multipart/form-data and
	// application/x-www-form-urlencoded bodies transparently.
	name := strings.TrimSpace(r.FormValue("name"))
	email := strings.TrimSpace(r.FormValue("email"))
	date := strings.TrimSpace(r.FormValue("date"))
	details := strings.TrimSpace(r.FormValue("details"))

	// Simple honeypot: a hidden field real visitors never fill in.
	// Silently "succeed" without sending mail if it's populated.
	if strings.TrimSpace(r.FormValue("company")) != "" {
		writeJSON(w, http.StatusOK, map[string]bool{"ok": true})
		return
	}

	if name == "" || email == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "Name and email are required."})
		return
	}

	if err := sendEnquiryEmail(name, email, date, details); err != nil {
		log.Printf("sendEnquiryEmail error: %v", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{
			"error": "Something went wrong sending that. Please try again or email Andrew directly.",
		})
		return
	}

	writeJSON(w, http.StatusOK, map[string]bool{"ok": true})
}

func sendEnquiryEmail(name, email, date, details string) error {
	host := getenv("SMTP_HOST", "smtp.gmail.com")
	port := getenv("SMTP_PORT", "587")
	user := os.Getenv("SMTP_USER")
	pass := os.Getenv("SMTP_PASS")
	to := getenv("CONTACT_TO_EMAIL", "mcmoandrew@gmail.com")

	if user == "" || pass == "" {
		return fmt.Errorf("SMTP_USER / SMTP_PASS are not configured")
	}

	// Header values must never contain raw CR/LF from user input — that
	// would allow header/body injection into the outgoing email.
	name = sanitizeHeader(name)
	email = sanitizeHeader(email)
	date = sanitizeHeader(date)

	subject := "New wedding enquiry from " + name
	if date != "" {
		subject += " (" + date + ")"
	}

	body := fmt.Sprintf(
		"New enquiry from the Andrew Mo wedding MC site:\n\nName: %s\nEmail: %s\nWedding date: %s\n\nDetails:\n%s\n",
		name, email, orDash(date), orDash(details),
	)

	msg := fmt.Sprintf(
		"From: %s\r\nTo: %s\r\nReply-To: %s\r\nSubject: %s\r\nMIME-Version: 1.0\r\nContent-Type: text/plain; charset=UTF-8\r\n\r\n%s",
		user, to, email, subject, body,
	)

	auth := smtp.PlainAuth("", user, pass, host)
	return smtp.SendMail(host+":"+port, auth, user, []string{to}, []byte(msg))
}

func orDash(s string) string {
	if s == "" {
		return "—"
	}
	return s
}

func sanitizeHeader(s string) string {
	s = strings.ReplaceAll(s, "\r", " ")
	s = strings.ReplaceAll(s, "\n", " ")
	return strings.TrimSpace(s)
}

func writeJSON(w http.ResponseWriter, status int, payload any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(payload)
}

func getenv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

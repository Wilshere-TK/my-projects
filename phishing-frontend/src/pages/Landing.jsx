import { Link } from "react-router-dom";
import "./Landing.css";

export default function Landing() {
  return (
    <>
      {/* Hero Section */}
      <div className="landing-hero page-hero text-white">
        <div className="overlay py-5">
          <div className="container py-5 text-center">
            <h1 className="display-3 fw-bold">PhishDetect</h1>
            <p className="lead mb-4">
              AI-powered phishing detection for URLs and emails — stay protected from online threats.
            </p>

            <div className="d-flex justify-content-center gap-3 mt-3">
              <Link className="btn btn-primary btn-lg px-4" to="/register">
                Get Started
              </Link>
              <Link className="btn btn-outline-light btn-lg px-4" to="/how">
                Learn More
              </Link>
            </div>

            <img
              src="https://cdn-icons-png.flaticon.com/512/1048/1048941.png"
              alt="Security icon"
              className="hero-icon mt-4"
            />
          </div>
        </div>
      </div>

      <div className="container mt-5">

        {/* What We Offer */}
        <section id="features">
          <h2 className="text-center fw-bold mb-4">What We Offer</h2>
          <div className="row g-4">

            <div className="col-md-4 text-center">
              <img
                src="https://cdn-icons-png.flaticon.com/512/3135/3135715.png"
                className="feature-icon"
                alt="AI detection"
              />
              <h4 className="fw-bold mt-3">AI-Powered URL Scanning</h4>
              <p>Instantly analyze suspicious URLs using advanced machine learning and threat intelligence.</p>
            </div>

            <div className="col-md-4 text-center">
              <img
                src="https://cdn-icons-png.flaticon.com/512/3050/3050525.png"
                className="feature-icon"
                alt="Email scanning"
              />
              <h4 className="fw-bold mt-3">Email Threat Detection</h4>
              <p>Scan email text and identify warning signs such as malicious intent and sender spoofing.</p>
            </div>

            <div className="col-md-4 text-center">
              <img
                src="https://cdn-icons-png.flaticon.com/512/2917/2917995.png"
                className="feature-icon"
                alt="Protection dashboard"
              />
              <h4 className="fw-bold mt-3">Realtime Protection Dashboard</h4>
              <p>Monitor safe and unsafe links, detection history, and system reports in one place.</p>
            </div>

          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="mt-5">
          <h2 className="fw-bold text-center mb-4">How It Works</h2>
          <div className="row align-items-center">
            <div className="col-md-6">
              <ul className="list-group list-group-flush steps-list">
                <li className="list-group-item"><strong>1. Paste the suspicious link</strong> into our analyzer.</li>
                <li className="list-group-item"><strong>2. AI evaluates</strong> the structure, domain, and behavior.</li>
                <li className="list-group-item"><strong>3. Instantly see results</strong> with classification and confidence score.</li>
                <li className="list-group-item"><strong>4. Get safety advice</strong> tailored to the URL/email risk.</li>
              </ul>
            </div>

            <div className="col-md-6 text-center">
              <img
                src="https://cdn.dribbble.com/users/285475/screenshots/3715240/security.gif"
                alt="How it works illustration"
                className="how-img img-fluid"
              />
            </div>
          </div>
        </section>

        {/* About Section */}
        <section id="about" className="mt-5">
          <h2 className="fw-bold text-center">About Phishing</h2>
          <p className="mt-3">
            Phishing is a growing cyber threat that tricks victims into revealing sensitive information like passwords
            or financial details. Attackers use fraudulent emails, fake login pages, and malicious URLs.
          </p>

          <img
            src="https://miro.medium.com/v2/resize:fit:828/format:webp/1*W1u0valKsHqodIZ6Tn6P8w.png"
            className="img-fluid rounded mt-3 shadow-sm"
            alt="Phishing example"
          />
        </section>

        {/* Testimonials */}
        <section id="testimonials" className="mt-5">
          <h2 className="fw-bold text-center mb-4">What Users Say</h2>
          <div className="row g-4">
            <div className="col-md-4">
              <div className="testimonial-card p-3 shadow-sm">
                <p>"This tool saved our company from multiple phishing attacks!"</p>
                <h6 className="text-end fw-bold">— IT Manager</h6>
              </div>
            </div>

            <div className="col-md-4">
              <div className="testimonial-card p-3 shadow-sm">
                <p>"Fast, easy, and extremely accurate. Highly recommended."</p>
                <h6 className="text-end fw-bold">— Cybersecurity Analyst</h6>
              </div>
            </div>

            <div className="col-md-4">
              <div className="testimonial-card p-3 shadow-sm">
                <p>"A must-have for anyone who receives emails from unknown sources."</p>
                <h6 className="text-end fw-bold">— Student User</h6>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="mt-5">
          <h2 className="fw-bold text-center mb-4">Frequently Asked Questions</h2>

          <div className="accordion" id="faqAccordion">
            <div className="accordion-item">
              <h2 className="accordion-header">
                <button className="accordion-button collapsed" data-bs-toggle="collapse" data-bs-target="#faq1">
                  How accurate is PhishDetect?
                </button>
              </h2>
              <div id="faq1" className="accordion-collapse collapse" data-bs-parent="#faqAccordion">
                <div className="accordion-body">
                  PhishDetect uses machine learning models trained on thousands of phishing and legitimate URLs.
                </div>
              </div>
            </div>

            <div className="accordion-item mt-2">
              <h2 className="accordion-header">
                <button className="accordion-button collapsed" data-bs-toggle="collapse" data-bs-target="#faq2">
                  Does it work for email text?
                </button>
              </h2>
              <div id="faq2" className="accordion-collapse collapse" data-bs-parent="#faqAccordion">
                <div className="accordion-body">Yes! It can analyze email text for intent, language clues, and suspicious content.</div>
              </div>
            </div>

            <div className="accordion-item mt-2">
              <h2 className="accordion-header">
                <button className="accordion-button collapsed" data-bs-toggle="collapse" data-bs-target="#faq3">
                  Is my data stored?
                </button>
              </h2>
              <div id="faq3" className="accordion-collapse collapse" data-bs-parent="#faqAccordion">
                <div className="accordion-body">Absolutely not. All scans are processed securely without saving user data.</div>
              </div>
            </div>
          </div>
        </section>

        {/* Contact */}
        <section id="contact" className="mt-5">
          <h2 className="fw-bold text-center">Contact Us</h2>
          <p className="text-center">For inquiries: <a href="mailto:security@example.com">security@example.com</a></p>

          <div className="text-center">
            <img
              src="https://cdn-icons-png.flaticon.com/512/1078/1078010.png"
              alt="contact icon"
              className="contact-icon"
            />
          </div>
        </section>

        <footer className="mt-5 text-center text-muted">
          <p>&copy; {new Date().getFullYear()} PhishDetect — Stay Safe Online</p>
        </footer>

      </div>
    </>
  );
}

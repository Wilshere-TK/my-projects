export default function About() {
  return (
    <div className="page-hero about-hero text-white">
      <div className="overlay py-5">
        <div className="container py-5">
          <h1 className="display-5">About Phishing</h1>
          <p className="lead">Learn what phishing is, how attackers trick users, and how our AI helps detect threats.</p>

          <div className="card mt-4 p-3">
            <h3>What is phishing?</h3>
            <p>Phishing is a social engineering attack used to steal user data, including login credentials and credit card numbers.</p>
            <h4>Common vectors</h4>
            <ul>
              <li>Deceptive emails</li>
              <li>Malicious URLs</li>
              <li>Fake websites that mimic legitimate services</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

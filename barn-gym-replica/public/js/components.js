class Navbar extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <nav class="navbar" style="padding: 20px 40px; display: flex; justify-content: space-between; align-items: center; position: absolute; top: 0; left: 0; right: 0; z-index: 100;">
        <a href="/" class="brand-logo">
          <!-- White logo for dark hero sections -->
          <img src="/logos/white.png" alt="Barn Gym" style="height: 60px;">
        </a>
        <div class="menu-toggle" style="background: rgba(255,255,255,0.1); border-radius: 50%; width: 44px; height: 44px; display: flex; flex-direction: column; justify-content: center; align-items: center; cursor: pointer; border: 1px solid rgba(255,255,255,0.2);">
          <span style="display: block; width: 16px; height: 1px; background: white; margin-bottom: 4px;"></span>
          <span style="display: block; width: 16px; height: 1px; background: white;"></span>
        </div>
      </nav>
    `;
  }
}

class Footer extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <footer class="footer-section bg-light-gray" style="padding: 80px 40px; font-family: 'Inter', sans-serif;">
        <div class="container" style="display: flex; flex-wrap: wrap; justify-content: space-between; max-width: 1200px; margin: 0 auto;">
          <!-- Left Col -->
          <div style="flex: 1; min-width: 250px; margin-bottom: 40px;">
            <p style="font-size: 11px; text-transform: uppercase; color: #666; letter-spacing: 1px; margin-bottom: 20px;">Location</p>
            <p style="font-size: 14px; color: #111;">Burwash, TN19 7DE, United Kingdom</p>

            <p style="font-size: 11px; text-transform: uppercase; color: #666; letter-spacing: 1px; margin-top: 40px; margin-bottom: 20px;">Opening Hours</p>
            <ul style="list-style: none; padding: 0; margin: 0; font-size: 13px; color: #555;">
              <li style="display: flex; justify-content: space-between; margin-bottom: 15px;"><span>Monday:</span> <span>6:00 AM - 9:00 PM</span></li>
              <li style="display: flex; justify-content: space-between; margin-bottom: 15px;"><span>Tuesday:</span> <span>6:00 AM - 9:00 PM</span></li>
              <li style="display: flex; justify-content: space-between; margin-bottom: 15px;"><span>Wednesday:</span> <span>6:00 AM - 9:00 PM</span></li>
              <li style="display: flex; justify-content: space-between; margin-bottom: 15px;"><span>Thursday:</span> <span>6:00 AM - 9:00 PM</span></li>
              <li style="display: flex; justify-content: space-between; margin-bottom: 15px;"><span>Friday:</span> <span>6:00 AM - 9:00 PM</span></li>
              <li style="display: flex; justify-content: space-between; margin-bottom: 15px;"><span>Saturday:</span> <span>7:00 AM - 2:00 PM</span></li>
              <li style="display: flex; justify-content: space-between;"><span>Sunday:</span> <span>8:00 AM - 12:00 PM</span></li>
            </ul>
          </div>

          <!-- Mid Col (Contact/Pages) -->
          <div style="flex: 1; min-width: 250px; display: flex; justify-content: space-around; margin-bottom: 40px;">
            <div>
              <p style="font-size: 11px; text-transform: uppercase; color: #666; letter-spacing: 1px; margin-bottom: 20px;">Contact Us</p>
              <a href="mailto:Guy@barn-gym.com" style="display: block; font-size: 24px; color: #111; text-decoration: none; margin-bottom: 15px; font-family: 'Playfair Display', serif;">Guy@barn-gym.com</a>
              <a href="tel:Call Us" style="display: block; font-size: 24px; color: #111; text-decoration: none; font-family: 'Playfair Display', serif;">Call Us</a>
            </div>
            
            <div>
              <p style="font-size: 11px; text-transform: uppercase; color: #666; letter-spacing: 1px; margin-bottom: 20px;">Pages</p>
              <ul style="list-style: none; padding: 0; margin: 0; font-size: 13px;">
                <li style="margin-bottom: 10px;"><a href="/how-to-join/6-week-transformation/" style="color: #555; text-decoration: none;">6 Week Transformation</a></li>
                <li style="margin-bottom: 10px;"><a href="/personal-training/" style="color: #555; text-decoration: none;">Personal Training</a></li>
                <li style="margin-bottom: 10px;"><a href="/how-to-join/classes/" style="color: #555; text-decoration: none;">Classes</a></li>
                <li style="margin-bottom: 10px;"><a href="/how-to-join/online-coaching/" style="color: #555; text-decoration: none;">Online Coaching</a></li>
                <li style="margin-bottom: 10px;"><a href="/community/" style="color: #555; text-decoration: none;">Community</a></li>
                <li style="margin-bottom: 10px;"><a href="/corporate-personal-training/" style="color: #555; text-decoration: none;">Corporate Personal Training</a></li>
                <li style="margin-bottom: 10px;"><a href="/retreats/" style="color: #555; text-decoration: none;">Retreats</a></li>
                <li style="margin-bottom: 10px;"><a href="/on-site-workshops/" style="color: #555; text-decoration: none;">On-Site Workshops</a></li>
                <li style="margin-bottom: 10px;"><a href="/about/" style="color: #555; text-decoration: none;">About</a></li>
                <li><a href="/contact/" style="color: #555; text-decoration: none;">Contact</a></li>
              </ul>
            </div>
          </div>

          <!-- Right Col (Legal/Social) -->
          <div style="flex: 1; min-width: 250px; display: flex; justify-content: space-around;">
            <div>
              <p style="font-size: 11px; text-transform: uppercase; color: #666; letter-spacing: 1px; margin-bottom: 20px;">Legal</p>
              <ul style="list-style: none; padding: 0; margin: 0; font-size: 13px;">
                <li style="margin-bottom: 10px;"><a href="/legal/privacy-policy" style="color: #555; text-decoration: none;">Privacy Policy</a></li>
                <li style="margin-bottom: 10px;"><a href="/legal/cookie-policy" style="color: #555; text-decoration: none;">Cookie Policy</a></li>
                <li><a href="/legal/terms-and-conditions" style="color: #555; text-decoration: none;">Terms & Conditions</a></li>
              </ul>
            </div>

            <div>
              <p style="font-size: 11px; text-transform: uppercase; color: #666; letter-spacing: 1px; margin-bottom: 20px;">Social Media</p>
              <ul style="list-style: none; padding: 0; margin: 0; font-size: 13px;">
                <li style="margin-bottom: 10px;"><a href="#" style="color: #555; text-decoration: none;">Instagram</a></li>
                <li><a href="#" style="color: #555; text-decoration: none;">LinkedIn</a></li>
              </ul>
            </div>
          </div>
        </div>

        <div style="text-align: center; margin-top: 80px;">
          <img src="/logos/color.png" alt="Barn Gym Header" style="max-width: 100px; margin: 60px 0; opacity: 0.8;">
        </div>
      </footer>
    `;
  }
}

customElements.define('barn-navbar', Navbar);
customElements.define('barn-footer', Footer);

// Auto-inject
document.addEventListener('DOMContentLoaded', () => {
  const navContainer = document.getElementById('navbar-placeholder');
  if (navContainer) navContainer.innerHTML = '<barn-navbar></barn-navbar>';

  const footContainer = document.getElementById('footer-placeholder');
  if (footContainer) footContainer.innerHTML = '<barn-footer></barn-footer>';
});

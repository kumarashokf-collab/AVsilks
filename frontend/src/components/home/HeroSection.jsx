import "./HeroSection.css";
import { Link } from "react-router-dom";
import { STORE } from "../../constants/store";
import heroImage from "../../assets/silk-hero.webp";

function HeroSection() {
  return (
    <section className="hero">
      <div className="container hero__container">
        <div className="hero__content">
          <p className="hero__eyebrow">
            Authentic Indian Sarees
          </p>

          <h1 className="hero__title">
            {STORE.tagline}
          </h1>

          <p className="hero__description">
            Discover carefully selected silk, Kanchipuram,
            Dharmavaram and festive sarees for every memorable
            occasion.
          </p>

          <div className="hero__actions">
            <a href="#featured-products" className="btn btn--primary">
              Shop Collection
            </a>

            <Link to="/cart" className="btn btn--secondary">
              View Cart
            </Link>
          </div>

          <div className="hero__highlights">
            <span>Quality Checked</span>
            <span>Secure Shopping</span>
            <span>Pan-India Delivery</span>
          </div>
        </div>

        <div className="hero__visual">
          <div className="hero__image-frame">
            <img
              src={heroImage}
              alt="AV Silks traditional saree collection"
              className="hero__image"
            />

            <div className="hero__offer-card">
              <strong>New Collection</strong>
              <span>Traditional elegance for every celebration</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default HeroSection;

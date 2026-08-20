import { useEffect, useMemo, useState } from "react";
import ProductCard from "../components/ProductCard";
import SearchAI from "../components/SearchAI";
import { useProducts } from "../context/ProductContext";
import { useLocale } from "../context/LocaleContext";
import { filterProductsByQuery } from "../services/searchMatching";
import { BRAND } from "../config/branding";

function Products() {
  const {
    products = [],
    loading,
    error
  } = useProducts();

  const { locale } = useLocale();

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] =
    useState("");

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [searchQuery]);

  const filteredProducts = useMemo(
    () =>
      filterProductsByQuery(
        products,
        debouncedSearchQuery,
        locale
      ),
    [
      products,
      debouncedSearchQuery,
      locale
    ]
  );

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "24px 0 72px",
        background: "var(--color-cream-50)"
      }}
    >
      <div className="container">
        <header
          style={{
            marginBottom: "22px",
            textAlign: "center"
          }}
        >
          <p className="section__eyebrow">
            {BRAND.name} Collection
          </p>

          <h1 style={{ marginBottom: "8px" }}>
            All Sarees
          </h1>

          <p
            style={{
              margin: 0,
              color: "var(--color-text-secondary)"
            }}
          >
            మా పూర్తి saree collectionను ఇక్కడ చూడండి.
          </p>
        </header>

        <div
          style={{
            position: "sticky",
            top: "68px",
            zIndex: 80,
            padding: "8px 0 14px",
            background: "var(--color-cream-50)"
          }}
        >
          <SearchAI onSearchChange={setSearchQuery} />
        </div>

        {loading ? (
          <div
            className="card"
            style={{
              padding: "32px",
              textAlign: "center"
            }}
          >
            Products loading...
          </div>
        ) : error ? (
          <div
            className="card"
            style={{
              padding: "32px",
              textAlign: "center"
            }}
          >
            {error}
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="home-products__grid">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
              />
            ))}
          </div>
        ) : (
          <div
            className="card"
            style={{
              padding: "32px",
              textAlign: "center"
            }}
          >
            {searchQuery ? `"${searchQuery}"కు సరిపోయే చీరలు లేవు.` : "ప్రస్తుతం products లేవు."}
          </div>
        )}
      </div>
    </main>
  );
}

export default Products;

import { useMemo, useState } from "react";
import ProductCard from "../components/ProductCard";
import SearchAI from "../components/SearchAI";
import { useProducts } from "../context/ProductContext";

function Products() {
  const {
    products = [],
    loading,
    error
  } = useProducts();

  const [searchQuery, setSearchQuery] = useState("");

  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return products;
    }

    return products.filter((product) => {
      const searchableText = [
        product?.name,
        product?.category,
        product?.description,
        product?.sku,
        product?.color,
        product?.fabric
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(query);
    });
  }, [products, searchQuery]);

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
            AV Silks Collection
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

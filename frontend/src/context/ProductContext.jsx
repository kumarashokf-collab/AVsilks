import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";

import {
  collection,
  onSnapshot,
  orderBy,
  query
} from "firebase/firestore";

import { db } from "../firebase";

import {
  createProduct,
  deactivateProduct
} from "../services/product.js";

const ProductContext = createContext(null);

export function useProducts() {
  const context = useContext(ProductContext);

  if (!context) {
    throw new Error(
      "useProducts must be used inside ProductProvider"
    );
  }

  return context;
}

function normalizeProduct(product = {}) {
  return {
    name: String(product.name || "").trim(),
    description: String(
      product.description ||
      product.desc ||
      ""
    ).trim(),
    price: Number(product.price || 0),
    originalPrice: Number(
      product.originalPrice ||
      product.mrp ||
      product.price ||
      0
    ),
    category: String(
      product.category ||
      "Uncategorized"
    ),
    stock: Number(product.stock || 0),
    sku: String(product.sku || "")
      .trim()
      .toUpperCase(),
    offer: String(product.offer || "").trim(),
    image: String(
      product.image ||
      product.imageUrl ||
      ""
    ).trim(),
    images: Array.isArray(product.images)
      ? product.images
          .map((url) => String(url || "").trim())
          .filter(Boolean)
          .slice(0, 5)
      : [],
    featured: Boolean(product.featured),
    active:
      product.active === undefined
        ? true
        : Boolean(product.active)
  };
}

export function ProductProvider({ children }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const productsRef = collection(db, "products");
    const productsQuery = query(
      productsRef,
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      productsQuery,
      (snapshot) => {
        const nextProducts = snapshot.docs.map(
          (productDoc) => ({
            id: productDoc.id,
            ...productDoc.data()
          })
        );

        setProducts(nextProducts);
        setError("");
        setLoading(false);
      },
      (snapshotError) => {
        console.error(
          "Firestore products load failed:",
          snapshotError
        );

        setError(
          snapshotError?.message ||
          "Products load కాలేదు."
        );
        setLoading(false);
      }
    );

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        setLoading(true);
      }
    }

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    );

    return () => {
      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );
      unsubscribe();
    };
  }, []);

  async function addProduct(
    product,
    user
  ) {
    try {
      const normalized =
        normalizeProduct(product);

      const result =
        await createProduct(
          normalized,
          user
        );

      return {
        success: true,
        id: result.id
      };
    } catch (addError) {
      console.error(
        "Product API add failed:",
        addError
      );

      alert(
        addError?.message ||
        "Product add కాలేదు."
      );

      return {
        success: false,
        error: addError
      };
    }
  }

  async function removeProduct(
    productId,
    user
  ) {
    try {
      const result =
        await deactivateProduct(
          productId,
          user
        );

      return {
        success: true,
        id: result.id,
        active: false
      };
    } catch (removeError) {
      console.error(
        "Product API deactivation failed:",
        removeError
      );

      alert(
        removeError?.message ||
        "Product deactivate కాలేదు."
      );

      return {
        success: false,
        error: removeError
      };
    }
  }

  const activeProducts = useMemo(
    () =>
      products.filter(
        (product) => product.active !== false
      ),
    [products]
  );

  const value = {
    products,
    activeProducts,
    loading,
    error,
    addProduct,
    removeProduct,
    refreshProducts: () => {}
  };

  return (
    <ProductContext.Provider value={value}>
      {children}
    </ProductContext.Provider>
  );
}

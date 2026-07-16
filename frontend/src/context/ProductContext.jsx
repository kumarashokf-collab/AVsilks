import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp
} from "firebase/firestore";

import { db } from "../firebase";

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

  async function addProduct(product) {
    try {
      const normalized = normalizeProduct(product);

      if (!normalized.name) {
        throw new Error(
          "Product name is required."
        );
      }

      if (
        !Number.isFinite(normalized.price) ||
        normalized.price <= 0
      ) {
        throw new Error(
          "Valid product price is required."
        );
      }

      if (!normalized.sku) {
        throw new Error(
          "SKU is required."
        );
      }

      const docRef = await addDoc(
        collection(db, "products"),
        {
          ...normalized,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        }
      );

      return {
        success: true,
        id: docRef.id
      };
    } catch (addError) {
      console.error(
        "Firestore product add failed:",
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

  async function removeProduct(productId) {
    try {
      await deleteDoc(
        doc(db, "products", productId)
      );

      return {
        success: true
      };
    } catch (deleteError) {
      console.error(
        "Firestore product delete failed:",
        deleteError
      );

      alert(
        deleteError?.message ||
        "Product delete కాలేదు."
      );

      return {
        success: false,
        error: deleteError
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

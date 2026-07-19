import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";

const CartContext = createContext(null);
const STORAGE_KEY = "avsilks_cart";

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used inside CartProvider");
  }

  return context;
}

function readStoredCart() {
  try {
    const savedCart = localStorage.getItem(STORAGE_KEY);
    const parsedCart = savedCart ? JSON.parse(savedCart) : [];

    return Array.isArray(parsedCart) ? parsedCart : [];
  } catch (error) {
    console.warn("Unable to read saved cart:", error);
    return [];
  }
}

function normalizeProduct(product) {
  return {
    id: product?.id,
    name: product?.name || "AV Silks Saree",
    price: Number(product?.salePrice || product?.price || 0),
    image:
      product?.image ||
      product?.imageUrl ||
      "",
    stock:
      product?.stock === undefined
        ? null
        : Number(product.stock),
    quantity: 1
  };
}

export function CartProvider({ children }) {
  const [cart, setCart] = useState(readStoredCart);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    } catch (error) {
      console.warn("Unable to save cart:", error);
    }
  }, [cart]);

  function addToCart(product, quantity = 1) {
    if (!product?.id) {
      return;
    }

    const requestedQuantity = Math.max(
      1,
      Math.min(Number(quantity) || 1, 10)
    );

    const normalizedProduct = normalizeProduct(product);

    const hasKnownStock =
      Number.isFinite(normalizedProduct.stock);

    if (
      hasKnownStock &&
      normalizedProduct.stock <= 0
    ) {
      return;
    }

    const initialMaxAllowed =
      hasKnownStock
        ? Math.min(normalizedProduct.stock, 10)
        : 10;

    const safeInitialQuantity = Math.min(
      requestedQuantity,
      initialMaxAllowed
    );

    setCart((currentCart) => {
      const existingItem = currentCart.find(
        (item) => item.id === product.id
      );

      if (existingItem) {
        return currentCart.map((item) => {
          if (item.id !== product.id) {
            return item;
          }

          const maxAllowed =
            Number.isFinite(item.stock) && item.stock > 0
              ? Math.min(item.stock, 10)
              : 10;

          return {
            ...item,
            quantity: Math.min(
              item.quantity + requestedQuantity,
              maxAllowed
            )
          };
        });
      }

      return [
        ...currentCart,
        {
          ...normalizedProduct,
          quantity: safeInitialQuantity
        }
      ];
    });
  }

  function updateQuantity(productId, quantity) {
    const safeQuantity = Math.max(
      1,
      Math.min(Number(quantity) || 1, 10)
    );

    setCart((currentCart) =>
      currentCart.map((item) => {
        if (item.id !== productId) {
          return item;
        }

        const maxAllowed =
          Number.isFinite(item.stock) && item.stock > 0
            ? Math.min(item.stock, 10)
            : 10;

        return {
          ...item,
          quantity: Math.min(safeQuantity, maxAllowed)
        };
      })
    );
  }

  function increaseQuantity(productId) {
    const item = cart.find(
      (cartItem) => cartItem.id === productId
    );

    if (!item) {
      return;
    }

    updateQuantity(productId, item.quantity + 1);
  }

  function decreaseQuantity(productId) {
    const item = cart.find(
      (cartItem) => cartItem.id === productId
    );

    if (!item) {
      return;
    }

    if (item.quantity <= 1) {
      removeFromCart(productId);
      return;
    }

    updateQuantity(productId, item.quantity - 1);
  }

  function removeFromCart(productId) {
    setCart((currentCart) =>
      currentCart.filter((item) => item.id !== productId)
    );
  }

  function clearCart() {
    setCart([]);
  }

  const cartCount = useMemo(
    () =>
      cart.reduce(
        (total, item) =>
          total + Number(item.quantity || 0),
        0
      ),
    [cart]
  );

  const subtotal = useMemo(
    () =>
      cart.reduce(
        (total, item) =>
          total +
          Number(item.price || 0) *
            Number(item.quantity || 0),
        0
      ),
    [cart]
  );

  const value = {
    cart,
    cartCount,
    subtotal,
    addToCart,
    updateQuantity,
    increaseQuantity,
    decreaseQuantity,
    removeFromCart,
    clearCart
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

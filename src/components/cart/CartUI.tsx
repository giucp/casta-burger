"use client";

import { createContext, useContext, useMemo, useState } from "react";
import type { MenuItem } from "@/lib/menu";
import { CartPanel } from "./CartPanel";
import { ProductSheet } from "./ProductSheet";

type CartUIValue = {
  abrirProducto: (item: MenuItem) => void;
  abrirCarrito: () => void;
};

const CartUIContext = createContext<CartUIValue | null>(null);

/**
 * Dueño de "qué panel está abierto". Vive aparte del estado del carrito para
 * que los sheets puedan usar `useCart` sin importarse en círculo.
 */
export function CartUIProvider({ children }: { children: React.ReactNode }) {
  const [producto, setProducto] = useState<MenuItem | null>(null);
  const [carrito, setCarrito] = useState(false);

  const valor = useMemo(
    () => ({
      abrirProducto: (item: MenuItem) => setProducto(item),
      abrirCarrito: () => setCarrito(true),
    }),
    [],
  );

  return (
    <CartUIContext value={valor}>
      {children}
      {producto && (
        <ProductSheet item={producto} onClose={() => setProducto(null)} />
      )}
      {carrito && <CartPanel onClose={() => setCarrito(false)} />}
    </CartUIContext>
  );
}

export function useCartUI(): CartUIValue {
  const ctx = useContext(CartUIContext);
  if (!ctx) {
    throw new Error("useCartUI debe usarse dentro de <CartUIProvider>");
  }
  return ctx;
}

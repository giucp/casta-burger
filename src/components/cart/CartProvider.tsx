"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import {
  cantidadTotal,
  claveLinea,
  precioUnitario,
  subtotalCarrito,
  type LineaCarrito,
  type OpcionesLinea,
} from "@/lib/cart";
import type { MenuItem } from "@/lib/menu";

type CartContextValue = {
  lineas: LineaCarrito[];
  cantidad: number;
  subtotal: number;
  agregar: (
    item: MenuItem,
    opciones: OpcionesLinea,
    cantidad: number,
    nota?: string,
  ) => void;
  cambiarCantidad: (key: string, cantidad: number) => void;
  quitar: (key: string) => void;
  vaciar: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lineas, setLineas] = useState<LineaCarrito[]>([]);

  const agregar = useCallback(
    (
      item: MenuItem,
      opciones: OpcionesLinea,
      cantidad: number,
      nota?: string,
    ) => {
      const key = claveLinea(item.id, opciones, nota);

      setLineas((actuales) => {
        const existente = actuales.find((l) => l.key === key);
        if (existente) {
          return actuales.map((l) =>
            l.key === key ? { ...l, cantidad: l.cantidad + cantidad } : l,
          );
        }

        return [
          ...actuales,
          {
            key,
            menuItemId: item.id,
            nombre: item.nombre,
            precioUnitario: precioUnitario(item, opciones),
            cantidad,
            opciones,
            nota: nota?.trim() || undefined,
          },
        ];
      });
    },
    [],
  );

  const cambiarCantidad = useCallback((key: string, cantidad: number) => {
    setLineas((actuales) =>
      cantidad <= 0
        ? actuales.filter((l) => l.key !== key)
        : actuales.map((l) => (l.key === key ? { ...l, cantidad } : l)),
    );
  }, []);

  const quitar = useCallback((key: string) => {
    setLineas((actuales) => actuales.filter((l) => l.key !== key));
  }, []);

  const vaciar = useCallback(() => setLineas([]), []);

  const valor = useMemo(
    () => ({
      lineas,
      cantidad: cantidadTotal(lineas),
      subtotal: subtotalCarrito(lineas),
      agregar,
      cambiarCantidad,
      quitar,
      vaciar,
    }),
    [lineas, agregar, cambiarCantidad, quitar, vaciar],
  );

  return <CartContext value={valor}>{children}</CartContext>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart debe usarse dentro de <CartProvider>");
  }
  return ctx;
}

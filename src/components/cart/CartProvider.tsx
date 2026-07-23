"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
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

/**
 * El carrito sobrevive al refresco: se guarda en localStorage. Un cliente que
 * arma el pedido, se distrae y vuelve, no debería encontrarlo vacío.
 *
 * Los precios guardados son solo para mostrar: al confirmar, el servidor
 * recalcula todo contra el menú vigente, así que un carrito viejo no puede
 * pagar precios viejos.
 */
const CLAVE_CARRITO = "casta-carrito-v1";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lineas, setLineas] = useState<LineaCarrito[]>([]);
  const cargado = useRef(false);

  useEffect(() => {
    try {
      const crudo = localStorage.getItem(CLAVE_CARRITO);
      if (crudo) {
        const datos = JSON.parse(crudo) as LineaCarrito[];
        // No puede ir en el useState inicial: en el servidor no hay
        // localStorage y el HTML no coincidiría con el del cliente.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (Array.isArray(datos) && datos.length > 0) setLineas(datos);
      }
    } catch {
      // Un carrito guardado corrupto no puede romper la página
    }
    cargado.current = true;
  }, []);

  useEffect(() => {
    if (!cargado.current) return;
    try {
      localStorage.setItem(CLAVE_CARRITO, JSON.stringify(lineas));
    } catch {
      // Sin espacio o en modo privado: el carrito sigue, solo no persiste
    }
  }, [lineas]);

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

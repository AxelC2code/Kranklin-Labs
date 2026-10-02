package Caso_Grupal;

import java.util.ArrayList;

public class Tienda {

    private String nombre;

    // Colección: lista donde se guardan todos los productos de la tienda
    private ArrayList<Producto> productos;

    public Tienda(String nombre) {
        this.nombre = nombre;
        this.productos = new ArrayList<Producto>();
    }

    public void agregarProducto(Producto producto) {
        for (Producto p : productos) {
            if (p.getCodigo().equals(producto.getCodigo())) {
                throw new IllegalArgumentException("Ya existe un producto con el codigo " + producto.getCodigo() + ".");
            }
        }
        productos.add(producto);
        System.out.println("Producto registrado: " + producto.getNombre());
    }

    public Producto buscarProducto(String codigo) {
        for (Producto p : productos) {
            if (p.getCodigo().equals(codigo)) {
                return p;
            }
        }
        throw new IllegalArgumentException("No existe un producto con el codigo " + codigo + ".");
    }

    public void mostrarProductos() {
        System.out.println("--- Productos de " + nombre + " (" + productos.size() + " en total) ---");
        for (Producto p : productos) {
            p.mostrarInformacion();
        }
    }

    public double calcularValorTotalStock() {
        double total = 0;
        for (Producto p : productos) {
            total = total + p.calcularValorStock();
        }
        return total;
    }
}

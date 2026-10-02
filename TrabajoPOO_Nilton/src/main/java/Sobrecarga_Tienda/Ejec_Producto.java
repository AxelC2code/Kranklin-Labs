package Sobrecarga_Tienda;

public class Ejec_Producto {

    public static void main(String[] args) {

        System.out.println("----- SISTEMA DE PRODUCTOS DE UNA TIENDA -----");

        // Cada producto usa un constructor distinto
        Producto producto1 = new Producto("P001", "Mouse inalambrico");
        Producto producto2 = new Producto("P002", "Teclado mecanico", 150.00);
        Producto producto3 = new Producto("P003", "Monitor 24 pulgadas", 600.00, 10);

        System.out.println();
        System.out.println("--- Registro de productos (sobrecarga de constructores) ---");
        producto1.mostrarInformacion();
        producto2.mostrarInformacion();
        producto3.mostrarInformacion();

        // 10.0 es double (porcentaje) y 50.0f es float (soles):
        // por el tipo de dato Java sabe qué versión del método usar
        System.out.println();
        System.out.println("--- Precio de venta del " + producto3.getNombre() + " (sobrecarga de metodos) ---");
        System.out.println("Precio normal: S/ " + String.format("%.2f", producto3.getPrecio()));
        System.out.println("Con 10% de descuento: S/ " + String.format("%.2f", producto3.calcularPrecioVenta(10.0)));
        System.out.println("Con S/ 50 de descuento fijo: S/ " + String.format("%.2f", producto3.calcularPrecioVenta(50.0f)));
        System.out.println("3 unidades con 10% de descuento: S/ " + String.format("%.2f", producto3.calcularPrecioVenta(10.0, 3)));
    }
}

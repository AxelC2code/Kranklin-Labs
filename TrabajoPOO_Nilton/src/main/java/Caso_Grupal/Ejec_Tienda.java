package Caso_Grupal;

public class Ejec_Tienda {

    public static void main(String[] args) {

        Tienda tienda = new Tienda("TecnoStore");

        System.out.println("----- CASO PRACTICO: TIENDA DE TECNOLOGIA -----");

        // 1. Registrar productos con los 3 constructores y guardarlos en la lista
        System.out.println();
        System.out.println("1. Registro de productos");
        tienda.agregarProducto(new Producto("T001", "Audifonos Bluetooth"));
        tienda.agregarProducto(new Producto("T002", "Memoria USB 64GB", 35.90));
        tienda.agregarProducto(new Producto("T003", "Laptop Lenovo IdeaPad", "Computo", 2500.00, 8));
        tienda.agregarProducto(new Producto("T004", "Mouse Logitech", "Accesorios", 45.50, 30));
        tienda.mostrarProductos();

        // 2. Consultar y modificar un producto
        System.out.println();
        System.out.println("2. Consultar y modificar un producto");
        Producto memoria = tienda.buscarProducto("T002");
        System.out.print("Antes:   ");
        memoria.mostrarInformacion();
        memoria.setCategoria("Almacenamiento");
        memoria.setPrecio(32.50);
        memoria.setStock(50);
        System.out.print("Despues: ");
        memoria.mostrarInformacion();

        // 3. Operaciones
        System.out.println();
        System.out.println("3. Operaciones con la laptop");
        Producto laptop = tienda.buscarProducto("T003");
        System.out.println("Valor del stock: S/ " + formato(laptop.calcularValorStock()));
        System.out.println("Precio con 15% de descuento: S/ " + formato(laptop.calcularPrecioVenta(15)));
        System.out.println("Importe de 2 unidades: S/ " + formato(laptop.calcularImporte(2)));
        System.out.println("Importe de 2 unidades con 15% de descuento: S/ " + formato(laptop.calcularImporte(2, 15)));
        System.out.println("Valor total del inventario: S/ " + formato(tienda.calcularValorTotalStock()));

        // 4. Reglas del sistema: cada error se captura con try-catch
        System.out.println();
        System.out.println("4. Validaciones (manejo de errores)");

        try {
            laptop.setPrecio(-100);
        } catch (IllegalArgumentException e) {
            System.out.println("Error: " + e.getMessage());
        }

        try {
            tienda.agregarProducto(new Producto("T005", "Teclado Redragon", "Accesorios", 120.00, -5));
        } catch (IllegalArgumentException e) {
            System.out.println("Error: " + e.getMessage());
        }

        try {
            laptop.calcularPrecioVenta(120);
        } catch (IllegalArgumentException e) {
            System.out.println("Error: " + e.getMessage());
        }

        try {
            laptop.calcularImporte(20);
        } catch (IllegalArgumentException e) {
            System.out.println("Error: " + e.getMessage());
        }

        try {
            tienda.agregarProducto(new Producto("T001", "Parlante JBL"));
        } catch (IllegalArgumentException e) {
            System.out.println("Error: " + e.getMessage());
        }

        try {
            tienda.buscarProducto("T999");
        } catch (IllegalArgumentException e) {
            System.out.println("Error: " + e.getMessage());
        }

        System.out.print("La laptop no cambio: ");
        laptop.mostrarInformacion();
    }

    private static String formato(double valor) {
        return String.format("%.2f", valor);
    }
}

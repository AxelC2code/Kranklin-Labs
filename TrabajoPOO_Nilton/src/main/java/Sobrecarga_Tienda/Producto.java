package Sobrecarga_Tienda;

public class Producto {

    private String codigo;
    private String nombre;
    private double precio;
    private int stock;

    // Sobrecarga de constructores: el producto se puede registrar de 3 formas

    // Solamente con código y nombre
    public Producto(String codigo, String nombre) {
        this(codigo, nombre, 0, 0); // llama al constructor completo
    }

    // Con código, nombre y precio
    public Producto(String codigo, String nombre, double precio) {
        this(codigo, nombre, precio, 0);
    }

    // Con código, nombre, precio y stock
    public Producto(String codigo, String nombre, double precio, int stock) {
        this.codigo = codigo;
        this.nombre = nombre;
        this.precio = precio;
        this.stock = stock;
    }

    public String getCodigo() {
        return codigo;
    }

    public void setCodigo(String codigo) {
        this.codigo = codigo;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public double getPrecio() {
        return precio;
    }

    public void setPrecio(double precio) {
        this.precio = precio;
    }

    public int getStock() {
        return stock;
    }

    public void setStock(int stock) {
        this.stock = stock;
    }

    // Sobrecarga de métodos: el precio de venta se calcula de 3 formas

    // 1. Aplicando un porcentaje de descuento (recibe double)
    public double calcularPrecioVenta(double porcentajeDescuento) {
        return precio - precio * porcentajeDescuento / 100;
    }

    // 2. Aplicando un descuento fijo en soles (recibe float)
    public double calcularPrecioVenta(float descuentoSoles) {
        return precio - descuentoSoles;
    }

    // 3. Aplicando descuento y cantidad de unidades
    public double calcularPrecioVenta(double porcentajeDescuento, int cantidad) {
        return calcularPrecioVenta(porcentajeDescuento) * cantidad;
    }

    public void mostrarInformacion() {
        System.out.println("Codigo: " + codigo + " | Nombre: " + nombre
                + " | Precio: S/ " + String.format("%.2f", precio) + " | Stock: " + stock);
    }
}

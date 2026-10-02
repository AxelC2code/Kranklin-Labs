package Caso_Grupal;

public class Producto {

    private String codigo;
    private String nombre;
    private String categoria;
    private double precio;
    private int stock;

    // Sobrecarga de constructores

    // Al inicio solo se conoce el código y el nombre
    public Producto(String codigo, String nombre) {
        this(codigo, nombre, "Sin categoria", 0, 0);
    }

    // Se conoce el código, nombre y precio
    public Producto(String codigo, String nombre, double precio) {
        this(codigo, nombre, "Sin categoria", precio, 0);
    }

    // Se tiene toda la información, incluyendo el stock
    public Producto(String codigo, String nombre, String categoria, double precio, int stock) {
        this.codigo = codigo;
        this.nombre = nombre;
        this.categoria = categoria;
        validarPrecio(precio); // se valida desde el inicio
        validarStock(stock);
        this.precio = precio;
        this.stock = stock;
    }

    // Getters y setters: consultar y modificar la información

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

    public String getCategoria() {
        return categoria;
    }

    public void setCategoria(String categoria) {
        this.categoria = categoria;
    }

    public double getPrecio() {
        return precio;
    }

    public void setPrecio(double precio) {
        validarPrecio(precio);
        this.precio = precio;
    }

    public int getStock() {
        return stock;
    }

    public void setStock(int stock) {
        validarStock(stock);
        this.stock = stock;
    }

    // Validaciones: el precio y el stock no pueden ser negativos

    private void validarPrecio(double precio) {
        if (precio < 0) {
            throw new IllegalArgumentException("El precio no puede ser negativo.");
        }
    }

    private void validarStock(int stock) {
        if (stock < 0) {
            throw new IllegalArgumentException("El stock no puede ser negativo.");
        }
    }

    // Operaciones

    // Valor del stock = precio x unidades disponibles
    public double calcularValorStock() {
        return precio * stock;
    }

    // Precio de venta aplicando un descuento entre 0% y 100%
    public double calcularPrecioVenta(double porcentajeDescuento) {
        if (porcentajeDescuento < 0 || porcentajeDescuento > 100) {
            throw new IllegalArgumentException("El descuento debe estar entre 0% y 100%.");
        }
        return precio - precio * porcentajeDescuento / 100;
    }

    // Importe de una cantidad de unidades
    public double calcularImporte(int cantidad) {
        validarCantidad(cantidad);
        return precio * cantidad;
    }

    // Sobrecarga: importe de una cantidad de unidades con descuento
    public double calcularImporte(int cantidad, double porcentajeDescuento) {
        validarCantidad(cantidad);
        return calcularPrecioVenta(porcentajeDescuento) * cantidad;
    }

    // La cantidad a vender no puede ser mayor que el stock disponible
    private void validarCantidad(int cantidad) {
        if (cantidad <= 0) {
            throw new IllegalArgumentException("La cantidad debe ser mayor que 0.");
        }
        if (cantidad > stock) {
            throw new IllegalArgumentException("No hay stock suficiente: se piden " + cantidad
                    + " unidades y solo hay " + stock + ".");
        }
    }

    public void mostrarInformacion() {
        System.out.println("[" + codigo + "] " + nombre + " | Categoria: " + categoria
                + " | Precio: S/ " + String.format("%.2f", precio) + " | Stock: " + stock);
    }
}

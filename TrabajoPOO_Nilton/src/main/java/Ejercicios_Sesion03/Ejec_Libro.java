package Ejercicios_Sesion03;

public class Ejec_Libro {

    public static void main(String[] args) {

        System.out.println("----- EJERCICIO 6: LIBRO Y PAGINA -----");

        Libro libro = new Libro("Java para principiantes");

        // Para crear una Pagina primero se necesita un objeto Libro
        Libro.Pagina pagina1 = libro.new Pagina(1, "Que es la programacion orientada a objetos");
        Libro.Pagina pagina2 = libro.new Pagina(2, "Clases, objetos y atributos");

        pagina1.mostrarContenido();
        pagina2.mostrarContenido();
    }
}

package Ejercicios_Sesion03;

public class Libro {

    private String titulo;

    public Libro(String titulo) {
        this.titulo = titulo;
    }

    // Clase interna: cada Pagina pertenece a un objeto Libro
    public class Pagina {

        private int numero;
        private String contenido;

        public Pagina(int numero, String contenido) {
            this.numero = numero;
            this.contenido = contenido;
        }

        public void mostrarContenido() {
            // La clase interna puede usar los atributos del Libro (titulo)
            System.out.println(titulo + " - Pagina " + numero + ": " + contenido);
        }
    }
}

package Ejercicios_Sesion03;

public class Ejec_Banco {

    public static void main(String[] args) {

        System.out.println("----- EJERCICIO 4: BANCO -----");

        // Los métodos static se llaman con el nombre de la clase, sin crear objetos
        Banco.mostrarTasa();

        Banco.actualizarTasa(8.5);
        Banco.mostrarTasa();

        Banco.actualizarTasa(-2);
        Banco.mostrarTasa();
    }
}

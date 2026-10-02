package Ejercicios_Sesion03;

public class Contador {

    // static: hay una sola variable para toda la clase y la comparten todos los objetos
    private static int totalObjetos = 0;

    public Contador() {
        totalObjetos++;
    }

    public static void mostrarTotal() {
        System.out.println("Total de objetos creados: " + totalObjetos);
    }
}

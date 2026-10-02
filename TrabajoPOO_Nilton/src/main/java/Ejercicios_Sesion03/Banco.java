package Ejercicios_Sesion03;

public class Banco {

    // static: la tasa es la misma para todo el banco
    private static double tasaInteres = 5.0;

    public static void actualizarTasa(double nuevaTasa) {
        if (nuevaTasa >= 0) {
            tasaInteres = nuevaTasa;
            System.out.println("Tasa actualizada correctamente.");
        } else {
            System.out.println("Error: la tasa no puede ser negativa.");
        }
    }

    public static void mostrarTasa() {
        System.out.println("Tasa de interes actual: " + tasaInteres + "%");
    }
}

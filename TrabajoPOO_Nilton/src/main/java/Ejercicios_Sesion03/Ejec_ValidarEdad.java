package Ejercicios_Sesion03;

public class Ejec_ValidarEdad {

    public static void main(String[] args) {

        System.out.println("----- EJERCICIO 9: VALIDAR EDAD -----");

        ValidarEdad validar = new ValidarEdad();
        int[] edades = {25, 18, 15};

        for (int edad : edades) {
            try {
                validar.verificarEdad(edad);

            } catch (IllegalArgumentException e) {
                System.out.println("Error: " + e.getMessage());
            }
        }
    }
}

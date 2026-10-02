package Ejercicios_Sesion03;

public class ValidarEdad {

    public void verificarEdad(int edad) {

        if (edad < 18) {
            throw new IllegalArgumentException("La edad " + edad + " no es valida, debe ser mayor o igual a 18.");
        }

        System.out.println("Edad " + edad + ": edad valida.");
    }
}

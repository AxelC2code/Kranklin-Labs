package Ejercicios_Sesion03;

public class Division {

    public void dividir(int numero1, int numero2) {

        try {
            int resultado = numero1 / numero2;
            System.out.println(numero1 + " / " + numero2 + " = " + resultado);

        } catch (ArithmeticException e) {
            System.out.println("Error: no se puede dividir " + numero1 + " entre cero.");
        }
    }
}

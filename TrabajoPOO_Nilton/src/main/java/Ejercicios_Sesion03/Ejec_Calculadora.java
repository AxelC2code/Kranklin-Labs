package Ejercicios_Sesion03;

public class Ejec_Calculadora {

    public static void main(String[] args) {

        Calculadora calc = new Calculadora();

        System.out.println("----- EJERCICIO 1: CALCULADORA -----");
        System.out.println("Suma de dos enteros (5 + 3): " + calc.sumar(5, 3));
        System.out.println("Suma de tres enteros (5 + 3 + 2): " + calc.sumar(5, 3, 2));
        System.out.println("Suma de dos decimales (2.5 + 4.3): " + calc.sumar(2.5, 4.3));
    }
}

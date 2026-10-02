package Ejercicios_Sesion03;

import java.util.InputMismatchException;
import java.util.Scanner;

public class Ejec_DivisionTeclado {

    public static void main(String[] args) {

        Scanner teclado = new Scanner(System.in);
        String respuesta;

        System.out.println("----- EJERCICIO 8: DIVISION CON DATOS DEL USUARIO -----");

        do {
            try {
                System.out.print("Ingrese el primer numero: ");
                int numero1 = teclado.nextInt();

                System.out.print("Ingrese el segundo numero: ");
                int numero2 = teclado.nextInt();

                int resultado = numero1 / numero2;
                System.out.println("Resultado: " + resultado);

            } catch (ArithmeticException e) {
                System.out.println("Error: no se puede dividir entre cero.");

            } catch (InputMismatchException e) {
                System.out.println("Error: debe ingresar solo numeros enteros.");
            }

            teclado.nextLine(); // limpia lo que quedó escrito en la línea
            System.out.print("Desea hacer otra division? (s/n): ");
            respuesta = teclado.nextLine();

        } while (respuesta.equalsIgnoreCase("s"));

        System.out.println("Programa terminado.");
    }
}

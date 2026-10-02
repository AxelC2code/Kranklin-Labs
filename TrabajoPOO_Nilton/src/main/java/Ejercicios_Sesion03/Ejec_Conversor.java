package Ejercicios_Sesion03;

public class Ejec_Conversor {

    public static void main(String[] args) {

        Conversor conv = new Conversor();

        double celsius = 25.0;
        float kilometros = 10.0f;
        int segundos = 125;

        System.out.println("----- EJERCICIO 2: CONVERSOR -----");
        System.out.println(celsius + " grados Celsius = " + conv.convertir(celsius) + " grados Fahrenheit");
        System.out.println(kilometros + " km = " + String.format("%.2f", conv.convertir(kilometros)) + " millas");
        System.out.println(segundos + " segundos = " + conv.convertir(segundos));
    }
}

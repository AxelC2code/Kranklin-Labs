package Ejercicios_Sesion03;

public class Conversor {

    // Sobrecarga: Java elige el método según el tipo de dato que recibe

    // Celsius a Fahrenheit (recibe double)
    public double convertir(double celsius) {
        return celsius * 9 / 5 + 32;
    }

    // Kilómetros a millas (recibe float)
    public double convertir(float kilometros) {
        return kilometros * 0.621371;
    }

    // Segundos a minutos y segundos (recibe int)
    public String convertir(int segundos) {
        int minutos = segundos / 60;
        int segundosRestantes = segundos % 60;
        return minutos + " minutos y " + segundosRestantes + " segundos";
    }
}

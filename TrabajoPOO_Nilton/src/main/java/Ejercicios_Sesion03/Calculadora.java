package Ejercicios_Sesion03;

public class Calculadora {

    // Sobrecarga de métodos: el mismo nombre "sumar" con distintos parámetros

    public int sumar(int numero1, int numero2) {
        return numero1 + numero2;
    }

    public int sumar(int numero1, int numero2, int numero3) {
        return numero1 + numero2 + numero3;
    }

    public double sumar(double numero1, double numero2) {
        return numero1 + numero2;
    }
}

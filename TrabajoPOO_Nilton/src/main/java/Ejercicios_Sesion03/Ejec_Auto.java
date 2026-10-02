package Ejercicios_Sesion03;

public class Ejec_Auto {

    public static void main(String[] args) {

        System.out.println("----- EJERCICIO 5: AUTO Y MOTOR -----");

        Auto auto1 = new Auto("Ford Mustang", "V8");
        Auto auto2 = new Auto("Tesla Model 3", "Electrico");

        auto1.mostrarMotor();
        auto2.mostrarMotor();
    }
}

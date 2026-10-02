package Ejercicios_Sesion03;

public class Ejec_Contador {

    public static void main(String[] args) {

        System.out.println("----- EJERCICIO 3: CONTADOR -----");

        Contador obj1 = new Contador();
        Contador obj2 = new Contador();
        Contador obj3 = new Contador();
        Contador.mostrarTotal();

        System.out.println("Se crea un objeto mas...");
        Contador obj4 = new Contador();
        Contador.mostrarTotal();
    }
}

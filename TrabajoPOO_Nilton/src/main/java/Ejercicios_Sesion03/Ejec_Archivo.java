package Ejercicios_Sesion03;

import java.io.IOException;

public class Ejec_Archivo {

    public static void main(String[] args) {

        System.out.println("----- EJERCICIO 10: LEER ARCHIVO -----");

        Archivo archivo = new Archivo();

        // Caso 1: el archivo existe
        try {
            archivo.leerArchivo("datos.txt");

        } catch (IOException e) {
            System.out.println("Error: no se pudo leer el archivo datos.txt");
        }

        // Caso 2: el archivo no existe
        try {
            archivo.leerArchivo("no_existe.txt");

        } catch (IOException e) {
            System.out.println("Error: no se pudo leer el archivo no_existe.txt");
        }
    }
}

package Ejercicios_Sesion03;

import java.io.BufferedReader;
import java.io.FileReader;
import java.io.IOException;

public class Archivo {

    // throws IOException: el método avisa que puede fallar y quien lo llame debe manejar el error
    public void leerArchivo(String nombreArchivo) throws IOException {

        BufferedReader lector = new BufferedReader(new FileReader(nombreArchivo));
        String linea;

        System.out.println("Contenido de " + nombreArchivo + ":");

        while ((linea = lector.readLine()) != null) {
            System.out.println("  " + linea);
        }

        lector.close();
    }
}

package Ejercicios_Sesion03;

public class Auto {

    private String marca;
    private Motor motor;

    public Auto(String marca, String tipoMotor) {
        this.marca = marca;
        this.motor = new Motor(tipoMotor); // desde Auto se instancia Motor
    }

    public void mostrarMotor() {
        System.out.println("Auto: " + marca + " | Tipo de motor: " + motor.obtenerTipo());
    }

    // Clase anidada: Motor está declarada dentro de Auto
    public static class Motor {

        private String tipo;

        public Motor(String tipo) {
            this.tipo = tipo;
        }

        public String obtenerTipo() {
            return tipo;
        }
    }
}

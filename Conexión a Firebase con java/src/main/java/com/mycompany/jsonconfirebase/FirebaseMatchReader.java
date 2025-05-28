package com.mycompany.jsonconfirebase;

/**
 *
 * @author GolVision Team
 */

import com.google.firebase.FirebaseOptions;
import com.google.firebase.database.*;
import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;

import java.io.FileInputStream;
import java.io.FileWriter;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.Map;
import java.util.concurrent.CountDownLatch;
import java.util.Scanner;

public class FirebaseMatchReader {

    public static Map<String, String> equiposMap = Equipos.getMapaEquipos();
    public static Map<String, String> ligasMap = Ligas.getMapaLigas();

    public static Scanner sc = new Scanner(System.in);

    public static void main(String[] args) {
        int op;

        DatabaseReference ligasRef;
        try {
            ligasRef = IniciarConexion();
            do {
                CountDownLatch latch = new CountDownLatch(1);
                menu();
                try {
                    op = sc.nextInt();
                    sc.nextLine();
                } catch (Exception e) {
                    op = 9;
                    sc.nextLine();
                }
                switch (op) {
                    case 1:
                        mostrarTodo(ligasRef, latch);
                        break;
                    case 2:
                        mostrarLiga(ligasRef, latch);
                        break;
                    case 3:
                        mostrarJornada(ligasRef, latch);
                        break;
                    case 4:
                        mostrarEquipo(ligasRef, latch);
                        break;
                    case 5:
                        mostrarIds();
                        break;
                    case 0:
                        System.out.println("Saliendo");
                        break;
                    default:
                        System.out.println("Introduce una opcion valida");
                }
            } while (op != 0);
        } catch (Exception e) {
            System.out.println(e.getMessage());
        }

    }

    private static DatabaseReference IniciarConexion() throws IOException, InterruptedException {
        FileInputStream serviceAccount = new FileInputStream("src/main/resources/golvision-bdd-firebase-adminsdk-fbsvc-aae26f00d2.json");

        FirebaseOptions options = new FirebaseOptions.Builder()
                .setCredentials(GoogleCredentials.fromStream(serviceAccount))
                .setDatabaseUrl("https://golvision-java-default-rtdb.europe-west1.firebasedatabase.app/")
                .build();

        FirebaseApp.initializeApp(options);

        DatabaseReference ligasRef = FirebaseDatabase.getInstance().getReference("ligas");
        return ligasRef;
    }

    private static void menu() {
        System.out.println("----------------------------------------");
        System.out.println("1. Mostrar todos los partidos de todas las ligas");
        System.out.println("2. Mostrar todos los partidos de una liga");
        System.out.println("3. Mostrar una jornada de una liga");
        System.out.println("4. Mostrar los partidos de un equipo");
        System.out.println("5. Mostrar IDs de equipos");
        System.out.println("0. Salir");
        System.out.println("----------------------------------------");
        System.out.println();
    }

    private static void mostrarTodo(DatabaseReference ligasRef, CountDownLatch latch) throws InterruptedException {
        ligasRef.addListenerForSingleValueEvent(new ValueEventListener() {
            @Override
            public void onDataChange(DataSnapshot snapshotLigas) {
                if (snapshotLigas.exists()) {
                    Boolean archivo = preguntarArchivo();
                    String nombreArchivo = null;
                    if (archivo) {
                        System.out.println("Introduce el nombre del archivo a crear");
                        nombreArchivo = sc.nextLine();
                    }

                    for (DataSnapshot ligaSnapshot : snapshotLigas.getChildren()) {
                        String ligaId = ligaSnapshot.getKey();
                        System.out.println("Liga: " + ligaId);
                        if (archivo) {
                            PrintWriter writer = null;
                            try {
                                writer = new PrintWriter(new FileWriter(nombreArchivo, true));
                                writer.println("Liga: " + ligaId);
                            } catch (Exception e) {
                                System.err.println("Error al guardar el archivo: " + e.getMessage());
                            } finally {
                                writer.close();
                            }
                        }

                        DataSnapshot matchesSnapshot = ligaSnapshot.child("matches");
                        for (DataSnapshot partidoSnapshot : matchesSnapshot.getChildren()) {
                            String date = partidoSnapshot.child("date").getValue(String.class);
                            String round = partidoSnapshot.child("round").getValue(String.class);
                            String team1 = partidoSnapshot.child("team1").getValue(String.class);
                            String team2 = partidoSnapshot.child("team2").getValue(String.class);
                            String time = partidoSnapshot.child("time").getValue(String.class);
                            Object t1 = partidoSnapshot.child("score/ft/0").getValue();
                            Object t2 = partidoSnapshot.child("score/ft/1").getValue();

                            String nombreTeam1 = equiposMap.getOrDefault(team1, "Desconocido");
                            String nombreTeam2 = equiposMap.getOrDefault(team2, "Desconocido");

                            System.out.println("Fecha: " + date);
                            System.out.println("Jornada: " + round);
                            System.out.println(nombreTeam1 + " vs " + nombreTeam2);
                            System.out.println("Hora: " + time);
                            System.out.println("Resultado: " + t1 + " - " + t2);
                            System.out.println("-------------");

                            if (archivo) {
                                PrintWriter writer = null;
                                try {
                                    writer = new PrintWriter(new FileWriter(nombreArchivo, true));
                                    writer.println("Fecha: " + date);
                                    writer.println("Jornada: " + round);
                                    writer.println(nombreTeam1 + " vs " + nombreTeam2);
                                    writer.println("Hora: " + time);
                                    writer.println("Resultado: " + t1 + " - " + t2);
                                    writer.println("-------------");
                                } catch (Exception e) {
                                    System.err.println("Error al guardar el archivo: " + e.getMessage());
                                } finally {
                                    writer.close();
                                }
                            }
                        }
                    }
               } else {
                    System.out.println("No hay ligas registradas.");
                }
                latch.countDown();
            }

            @Override
            public void onCancelled(DatabaseError error) {
                System.err.println("Error al leer las ligas: " + error.getMessage());
                latch.countDown();
            }

        });
        latch.await();
    }

    private static void mostrarLiga(DatabaseReference ligasRef, CountDownLatch latch) throws InterruptedException {
        ligasRef.addListenerForSingleValueEvent(new ValueEventListener() {
            @Override
            public void onDataChange(DataSnapshot snapshotLigas) {
                if (snapshotLigas.exists()) {
                    Boolean archivo = preguntarArchivo();
                    String nombreArchivo = null;
                    if (archivo) {
                        System.out.println("Introduce el nombre del archivo a crear");
                        nombreArchivo = sc.nextLine();
                    }
                    int op2;
                    do {
                        System.out.println("Qué liga quieres revisar?");
                        System.out.println("0. La Liga EA Sports");
                        System.out.println("1. Premier League");
                        System.out.println("2. Serie A");
                        op2 = sc.nextInt();
                    } while (!(op2 == 0 || op2 == 1 || op2 == 2));
                    String opcion = "" + op2;

                    DataSnapshot ligaSeleccionada = null;

                    String liga = ligasMap.getOrDefault(opcion, "Desconocido");

                    for (DataSnapshot ligaSnapshot : snapshotLigas.getChildren()) {
                        String ligaId = ligaSnapshot.getKey();
                        if (ligaId.equals(liga)) {
                            ligaSeleccionada = ligaSnapshot;
                        }
                    }

                    if (ligaSeleccionada == null) {
                        System.out.println("Liga no encontrada.");
                        latch.countDown();
                        return;
                    }
                    for (DataSnapshot ligaSnapshot : snapshotLigas.getChildren()) {
                        String ligaId = ligaSnapshot.getKey();
                        DataSnapshot matchesSnapshot = ligaSnapshot.child("matches");
                        if (liga.equals(ligaId)) {
                            for (DataSnapshot partidoSnapshot : matchesSnapshot.getChildren()) {
                                String date = partidoSnapshot.child("date").getValue(String.class);
                                String round = partidoSnapshot.child("round").getValue(String.class);
                                String team1 = partidoSnapshot.child("team1").getValue(String.class);
                                String team2 = partidoSnapshot.child("team2").getValue(String.class);
                                String time = partidoSnapshot.child("time").getValue(String.class);
                                Object t1 = partidoSnapshot.child("score/ft/0").getValue();
                                Object t2 = partidoSnapshot.child("score/ft/1").getValue();

                                String nombreTeam1 = equiposMap.getOrDefault(team1, "Desconocido");
                                String nombreTeam2 = equiposMap.getOrDefault(team2, "Desconocido");

                                System.out.println("Fecha: " + date);
                                System.out.println("Jornada: " + round);
                                System.out.println(nombreTeam1 + " vs " + nombreTeam2);
                                System.out.println("Hora: " + time);
                                System.out.println("Resultado: " + t1 + " - " + t2);
                                System.out.println("-------------");
                                
                                                            if (archivo) {
                                PrintWriter writer = null;
                                try {
                                    writer = new PrintWriter(new FileWriter(nombreArchivo, true));
                                    writer.println("Fecha: " + date);
                                    writer.println("Jornada: " + round);
                                    writer.println(nombreTeam1 + " vs " + nombreTeam2);
                                    writer.println("Hora: " + time);
                                    writer.println("Resultado: " + t1 + " - " + t2);
                                    writer.println("-------------");
                                } catch (Exception e) {
                                    System.err.println("Error al guardar el archivo: " + e.getMessage());
                                } finally {
                                    writer.close();
                                }
                            }
                            }
                        }
                    }
                } else {
                    System.out.println("No hay ligas registradas.");
                }
                latch.countDown();
            }

            @Override
            public void onCancelled(DatabaseError error) {
                System.err.println("Error al leer las ligas: " + error.getMessage());
                latch.countDown();
            }
        });
        latch.await();
        sc.nextLine();
    }

    private static void mostrarJornada(DatabaseReference ligasRef, CountDownLatch latch) throws InterruptedException {

        ligasRef.addListenerForSingleValueEvent(new ValueEventListener() {
            @Override
            public void onDataChange(DataSnapshot snapshotLigas) {
                if (snapshotLigas.exists()) {
                    Boolean archivo = preguntarArchivo();
                    String nombreArchivo = null;
                    if (archivo) {
                        System.out.println("Introduce el nombre del archivo a crear");
                        nombreArchivo = sc.nextLine();
                    }
                    int op2;
                    do {
                        System.out.println("Qué liga quieres revisar?");
                        System.out.println("0. La Liga EA Sports");
                        System.out.println("1. Premier League");
                        System.out.println("2. Serie A");
                        op2 = sc.nextInt();
                    } while (!(op2 == 0 || op2 == 1 || op2 == 2));
                    String opcion = "" + op2;
                    DataSnapshot ligaSeleccionada = null;

                    String liga = ligasMap.getOrDefault(opcion, "Desconocido");

                    for (DataSnapshot ligaSnapshot : snapshotLigas.getChildren()) {
                        String ligaId = ligaSnapshot.getKey();
                        if (ligaId.equals(liga)) {
                            ligaSeleccionada = ligaSnapshot;
                        }
                    }

                    if (ligaSeleccionada == null) {
                        System.out.println("Liga no encontrada.");
                        latch.countDown();
                        return;
                    }

                    int jornada;
                    do {
                        System.out.println("Selecciona la jornada (1 - 38):");
                        jornada = sc.nextInt();
                    } while (jornada < 1 || jornada > 38);

                    DataSnapshot matchesSnapshot = ligaSeleccionada.child("matches");
                    boolean partidosEncontrados = false;

                    for (DataSnapshot partidoSnapshot : matchesSnapshot.getChildren()) {
                        String round = partidoSnapshot.child("round").getValue(String.class);
                        if (round != null && round.equals(String.valueOf(jornada))) {
                            String date = partidoSnapshot.child("date").getValue(String.class);
                            String team1 = partidoSnapshot.child("team1").getValue(String.class);
                            String team2 = partidoSnapshot.child("team2").getValue(String.class);
                            String time = partidoSnapshot.child("time").getValue(String.class);
                            Object t1 = partidoSnapshot.child("score/ft/0").getValue();
                            Object t2 = partidoSnapshot.child("score/ft/1").getValue();

                            String nombreTeam1 = equiposMap.getOrDefault(team1, "Desconocido");
                            String nombreTeam2 = equiposMap.getOrDefault(team2, "Desconocido");

                            System.out.println("Fecha: " + date);
                            System.out.println("Jornada: " + round);
                            System.out.println(nombreTeam1 + " vs " + nombreTeam2);
                            System.out.println("Hora: " + time);
                            System.out.println("Resultado: " + t1 + " - " + t2);
                            System.out.println("-------------");
                            partidosEncontrados = true;
                            
                            if (archivo) {
                                PrintWriter writer = null;
                                try {
                                    writer = new PrintWriter(new FileWriter(nombreArchivo, true));
                                    writer.println("Fecha: " + date);
                                    writer.println("Jornada: " + round);
                                    writer.println(nombreTeam1 + " vs " + nombreTeam2);
                                    writer.println("Hora: " + time);
                                    writer.println("Resultado: " + t1 + " - " + t2);
                                    writer.println("-------------");
                                } catch (Exception e) {
                                    System.err.println("Error al guardar el archivo: " + e.getMessage());
                                } finally {
                                    writer.close();
                                }
                            }
                        }
                    }

                    if (!partidosEncontrados) {
                        System.out.println("No hay partidos para la jornada seleccionada.");
                    }
                } else {
                    System.out.println("No hay ligas registradas.");
                }
                latch.countDown();
                sc.nextLine();
            }

            @Override
            public void onCancelled(DatabaseError error) {
                System.err.println("Error al leer las ligas: " + error.getMessage());
                latch.countDown();
            }
        });
        latch.await();
        sc.nextLine();
    }

    private static void mostrarEquipo(DatabaseReference ligasRef, CountDownLatch latch) throws InterruptedException {
        ligasRef.addListenerForSingleValueEvent(new ValueEventListener() {
            @Override
            public void onDataChange(DataSnapshot snapshotLigas) {
                if (snapshotLigas.exists()) {
                    Boolean archivo = preguntarArchivo();
                    String nombreArchivo = null;
                    if (archivo) {
                        System.out.println("Introduce el nombre del archivo a crear");
                        nombreArchivo = sc.nextLine();
                    }
                    int op2;
                    do {
                        System.out.println("Qué liga quieres revisar?");
                        System.out.println("0. La Liga EA Sports");
                        System.out.println("1. Premier League");
                        System.out.println("2. Serie A");
                        op2 = sc.nextInt();
                    } while (!(op2 == 0 || op2 == 1 || op2 == 2));

                    String opcion = "" + op2;
                    DataSnapshot ligaSeleccionada = null;

                    String liga = ligasMap.getOrDefault(opcion, "Desconocido");

                    for (DataSnapshot ligaSnapshot : snapshotLigas.getChildren()) {
                        if (ligaSnapshot.getKey().equals(liga)) {
                            ligaSeleccionada = ligaSnapshot;
                            break;
                        }
                    }

                    if (ligaSeleccionada == null) {
                        System.out.println("Liga no encontrada.");
                        latch.countDown();
                        return;
                    }

                    int minId = op2 * 20 + 1;
                    int maxId = minId + 19;

                    int equipoId;
                    do {
                        System.out.printf("Selecciona el ID del equipo (%d - %d):%n", minId, maxId);
                        equipoId = sc.nextInt();
                    } while (equipoId < minId || equipoId > maxId);

                    String equipoIdStr = String.valueOf(equipoId);
                    DataSnapshot matchesSnapshot = ligaSeleccionada.child("matches");
                    boolean partidosEncontrados = false;

                    for (DataSnapshot partidoSnapshot : matchesSnapshot.getChildren()) {
                        String team1 = partidoSnapshot.child("team1").getValue(String.class);
                        String team2 = partidoSnapshot.child("team2").getValue(String.class);

                        if (equipoIdStr.equals(team1) || equipoIdStr.equals(team2)) {
                            String date = partidoSnapshot.child("date").getValue(String.class);
                            String round = partidoSnapshot.child("round").getValue(String.class);
                            String time = partidoSnapshot.child("time").getValue(String.class);
                            Object t1 = partidoSnapshot.child("score/ft/0").getValue();
                            Object t2 = partidoSnapshot.child("score/ft/1").getValue();

                            String nombreTeam1 = equiposMap.getOrDefault(team1, "Desconocido");
                            String nombreTeam2 = equiposMap.getOrDefault(team2, "Desconocido");

                            System.out.println("Fecha: " + date);
                            System.out.println("Jornada: " + round);
                            System.out.println(nombreTeam1 + " vs " + nombreTeam2);
                            System.out.println("Hora: " + time);
                            System.out.println("Resultado: " + t1 + " - " + t2);
                            System.out.println("-------------");
                            partidosEncontrados = true;
                            
                            if (archivo) {
                                PrintWriter writer = null;
                                try {
                                    writer = new PrintWriter(new FileWriter(nombreArchivo, true));
                                    writer.println("Fecha: " + date);
                                    writer.println("Jornada: " + round);
                                    writer.println(nombreTeam1 + " vs " + nombreTeam2);
                                    writer.println("Hora: " + time);
                                    writer.println("Resultado: " + t1 + " - " + t2);
                                    writer.println("-------------");
                                } catch (Exception e) {
                                    System.err.println("Error al guardar el archivo: " + e.getMessage());
                                } finally {
                                    writer.close();
                                }
                            }
                        }
                    }

                    if (!partidosEncontrados) {
                        System.out.println("No se encontraron partidos para ese equipo.");
                    }

                } else {
                    System.out.println("No hay ligas registradas.");
                }
                latch.countDown();
            }

            @Override
            public void onCancelled(DatabaseError error) {
                System.err.println("Error al leer las ligas: " + error.getMessage());
                latch.countDown();
            }
        });
        latch.await();

        sc.nextLine();
    }

    private static boolean preguntarArchivo() {
        System.out.println("Quieres exportarlo a archivo? (s/n)");
        char letra = sc.nextLine().charAt(0);
        if (letra == 's' || letra == 'S') {
            return true;
        }
        return false;
    }

    private static void mostrarIds() {
        System.out.println("IDs de todos los equipos:");
        for (int i = 1; i <= 60; i++) {
            String id = ""+i;
            if ((i-1) % 20 == 0) {
                System.out.println("\n");
            }
            System.out.println(id+". "+equiposMap.getOrDefault(id, "Desconocido"));
        }
    }
}

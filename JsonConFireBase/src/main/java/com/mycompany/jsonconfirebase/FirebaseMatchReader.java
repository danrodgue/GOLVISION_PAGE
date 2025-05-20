/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.mycompany.jsonconfirebase;

/**
 *
 * @author pmeli
 */
import com.google.firebase.FirebaseOptions;
import com.google.firebase.database.*;
import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;

import java.io.FileInputStream;
import java.io.IOException;
import java.util.concurrent.CountDownLatch;

public class FirebaseMatchReader {

    public static void main(String[] args) throws IOException, InterruptedException {
        // Ruta a tu archivo de credenciales descargado desde Firebase
        FileInputStream serviceAccount = new FileInputStream("src/main/resources/golvision-bdd-firebase-adminsdk-fbsvc-aae26f00d2.json");

        FirebaseOptions options = new FirebaseOptions.Builder()
                .setCredentials(GoogleCredentials.fromStream(serviceAccount))
                .setDatabaseUrl("https://golvision-bdd-default-rtdb.europe-west1.firebasedatabase.app")
                .build();

        FirebaseApp.initializeApp(options);
        CountDownLatch latch = new CountDownLatch(1);

        DatabaseReference ligasRef = FirebaseDatabase.getInstance().getReference("ligas");
        System.out.println("HOLA");
        ligasRef.addListenerForSingleValueEvent(new ValueEventListener() {
            @Override
            public void onDataChange(DataSnapshot snapshotLigas) {
                if (snapshotLigas.exists()) {
                    for (DataSnapshot ligaSnapshot : snapshotLigas.getChildren()) {
                        String ligaId = ligaSnapshot.getKey();
                        System.out.println("🏆 Liga: " + ligaId);

                        DataSnapshot matchesSnapshot = ligaSnapshot.child("matches");
                        for (DataSnapshot partidoSnapshot : matchesSnapshot.getChildren()) {
                            String date = partidoSnapshot.child("date").getValue(String.class);
                            String round = partidoSnapshot.child("round").getValue(String.class);
                            String team1 = partidoSnapshot.child("team1").getValue(String.class);
                            String team2 = partidoSnapshot.child("team2").getValue(String.class);
                            String time = partidoSnapshot.child("time").getValue(String.class);
                            Object t1 = partidoSnapshot.child("score/ft/0").getValue();
                            Object t2 = partidoSnapshot.child("score/ft/1").getValue();

                            System.out.println("📅 Fecha: " + date);
                            System.out.println("🔁 Jornada: " + round);
                            System.out.println("⚽ " + team1 + " vs " + team2);
                            System.out.println("🕖 Hora: " + time);
                            System.out.println("Resultado: " + t1 + " - " + t2);
                            System.out.println("-------------");
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
//System.out.println("HOLA");
//        ref.addListenerForSingleValueEvent(new ValueEventListener() {
//            @Override
//            public void onDataChange(DataSnapshot dataSnapshot) {
//                
//                for (DataSnapshot snapshot : dataSnapshot.getChildren()) {
//                    Match match = snapshot.getValue(Match.class);
//                    System.out.println(match);
//                }
//            }

//            @Override
//            public void onCancelled(DatabaseError databaseError) {
//                System.err.println("Error: " + databaseError.getMessage());
//            }
//        });
    }
}

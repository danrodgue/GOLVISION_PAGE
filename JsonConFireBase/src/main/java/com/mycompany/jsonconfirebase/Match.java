/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.mycompany.jsonconfirebase;

/**
 *
 * @author pmeli
 */
public class Match {
     public String date;
    public String round;
    public String time;
    public Score score;

    public Match() {}

    @Override
    public String toString() {
        return round + ": " + score.team1 + " vs " + score.team2 + " on " + date + " at " + time;
    }
}

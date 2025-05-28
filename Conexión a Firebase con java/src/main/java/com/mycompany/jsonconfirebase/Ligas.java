/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.mycompany.jsonconfirebase;

import java.util.HashMap;
import java.util.Map;

/**
 *
 * @author GolVision Team
 */
public class Ligas {

    public static Map<String, String> getMapaLigas() {
        Map<String, String> map = new HashMap<>();

        // La Liga
        map.put("0", "Spain Primera Division 2024-2025");
        map.put("1", "Premier League 2024-25");
        map.put("2", "Serie A");
        
        return map;
    }
}
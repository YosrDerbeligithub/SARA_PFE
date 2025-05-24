package com.example.sara;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@EnableScheduling 
@SpringBootApplication
public class SaraApplication {

	public static void main(String[] args) {
		SpringApplication.run(SaraApplication.class, args);
	}

}

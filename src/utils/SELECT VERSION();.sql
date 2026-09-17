SELECT VERSION(); 

  

CREATE DATABASE teste; 

  

USE teste; 

  

CREATE TABLE alunos 
 ( 
   registroAcademico INT, 
     nome VARCHAR(100) NOT NULL, 
     idade TINYINT SIGNED DEFAULT 0, 
     PRIMARY KEY (registroAcademico) 
 ); 

  

SELECT * FROM alunos; 

  

CREATE TABLE curso 
 ( 
   id_curso INT AUTO_INCREMENT, 
     nome_curso VARCHAR(200) NOT NULL UNIQUE, 
     PRIMARY KEY (id_curso) 
 ); 

  

SELECT * FROM curso; 

  

ALTER TABLE alunos 
 ADD id_curso INT, 
 ADD CONSTRAINT fk_curso 
     FOREIGN KEY (id_curso) REFERENCES curso(id_curso);
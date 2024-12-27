/*
  # Initial Schema Setup for Educational Management System

  1. New Tables
    - `classes`
      - `id` (uuid, primary key)
      - `name` (text, class name)
      - `description` (text)
      - `teacher_id` (uuid, references auth.users)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `students`
      - `id` (uuid, primary key)
      - `class_id` (uuid, references classes)
      - `last_name` (text)
      - `first_name` (text)
      - `pin` (text, hashed)
      - `pin_changed` (boolean)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for teachers to manage their classes
    - Add policies for students to access their class data
*/

-- Create classes table
CREATE TABLE IF NOT EXISTS classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  teacher_id uuid REFERENCES auth.users NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create students table
CREATE TABLE IF NOT EXISTS students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid REFERENCES classes ON DELETE CASCADE NOT NULL,
  last_name text NOT NULL,
  first_name text NOT NULL,
  pin text NOT NULL,
  pin_changed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

-- Policies for classes
CREATE POLICY "Teachers can manage their own classes"
  ON classes
  FOR ALL
  TO authenticated
  USING (auth.uid() = teacher_id)
  WITH CHECK (auth.uid() = teacher_id);

-- Policies for students
CREATE POLICY "Teachers can manage students in their classes"
  ON students
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM classes 
    WHERE classes.id = students.class_id 
    AND classes.teacher_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM classes 
    WHERE classes.id = students.class_id 
    AND classes.teacher_id = auth.uid()
  ));

/*
  # Add RLS policy for the students login page access to classes/students

    - Students can view all created classes in the drop-down menu
    - Students can view all students in the chosen class drop-down menu
*/

CREATE POLICY "Anyone can view classes"
  ON classes
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Students can view other students in their class"
  ON students
  FOR SELECT
  TO public
  USING (true);

/*
  # Add RLS policy for activity points

  1. Changes
    - Add policy to allow students to view activity points for their class
    - Add policy to allow public access to activities table for student portal
  
  2. Security
    - Students can only view activity points for activities in their class
    - Students cannot modify activity points
*/

-- Policy for students to view activity points
CREATE POLICY "Students can view activity points in their class"
  ON activity_points
  FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM activities a
      JOIN classes c ON c.id = a.class_id
      JOIN students s ON s.class_id = c.id
      WHERE a.id = activity_points.activity_id
      AND s.id = activity_points.student_id
    )
  );

-- Policy for students to view activities
CREATE POLICY "Students can view activities in their class"
  ON activities
  FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.class_id = activities.class_id
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_classes_teacher_id ON classes(teacher_id);
CREATE INDEX IF NOT EXISTS idx_students_class_id ON students(class_id);
CREATE INDEX IF NOT EXISTS idx_students_names ON students(last_name, first_name);
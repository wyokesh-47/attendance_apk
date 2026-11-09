import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'demo_repository.dart';
import 'screens.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final preferences = await SharedPreferences.getInstance();
  runApp(AttendanceDemoApp(
    repository: DemoAttendanceRepository(preferences),
  ));
}

class AttendanceDemoApp extends StatelessWidget {
  const AttendanceDemoApp({super.key, required this.repository});

  final AttendanceRepository repository;

  @override
  Widget build(BuildContext context) {
    const forest = Color(0xFF176B56);
    return MaterialApp(
      title: 'Campus attendance',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          seedColor: forest,
          primary: forest,
          surface: const Color(0xFFF7F8F6),
        ),
        scaffoldBackgroundColor: const Color(0xFFF7F8F6),
        fontFamily: 'Roboto',
        appBarTheme: const AppBarTheme(
          backgroundColor: Color(0xFFF7F8F6),
          surfaceTintColor: Colors.transparent,
          elevation: 0,
          centerTitle: false,
        ),
        inputDecorationTheme: InputDecorationTheme(
          filled: true,
          fillColor: Colors.white,
          contentPadding:
              const EdgeInsets.symmetric(horizontal: 16, vertical: 15),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(14),
            borderSide: const BorderSide(color: Color(0xFFEAECF0)),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(14),
            borderSide: const BorderSide(color: Color(0xFFEAECF0)),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(14),
            borderSide: const BorderSide(color: forest, width: 1.5),
          ),
        ),
      ),
      home: LoginScreen(repository: repository),
    );
  }
}

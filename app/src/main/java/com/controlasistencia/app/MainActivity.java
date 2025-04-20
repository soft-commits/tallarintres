package com.controlasistencia.app;

import android.Manifest;
import android.content.pm.PackageManager;
import android.location.Location;
import android.os.Bundle;
import android.widget.Button;
import android.widget.EditText;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;

import com.google.android.gms.location.FusedLocationProviderClient;
import com.google.android.gms.location.LocationServices;
import com.google.android.gms.tasks.OnSuccessListener;
import com.google.firebase.database.DatabaseReference;
import com.google.firebase.database.FirebaseDatabase;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

public class MainActivity extends AppCompatActivity {

    EditText inputNombre, inputApellido, inputCodigo, inputFacultad, inputEspecialidad;
    TextView textUbicacion;
    Button btnRegistrar;

    FusedLocationProviderClient fusedLocationClient;
    DatabaseReference databaseReference;
    final int CODIGO_PERMISO_UBICACION = 100;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        inputNombre = findViewById(R.id.inputNombre);
        inputApellido = findViewById(R.id.inputApellido);
        inputCodigo = findViewById(R.id.inputCodigo);
        inputFacultad = findViewById(R.id.inputFacultad);
        inputEspecialidad = findViewById(R.id.inputEspecialidad);
        textUbicacion = findViewById(R.id.textUbicacion);
        btnRegistrar = findViewById(R.id.btnRegistrar);

        fusedLocationClient = LocationServices.getFusedLocationProviderClient(this);
        databaseReference = FirebaseDatabase.getInstance().getReference("asistencias");

        btnRegistrar.setOnClickListener(v -> {
            if (validarCampos()) {
                pedirPermisoYRegistrar();
            } else {
                Toast.makeText(this, "Completa todos los campos", Toast.LENGTH_SHORT).show();
            }
        });
    }

    private boolean validarCampos() {
        return !inputNombre.getText().toString().isEmpty() &&
                !inputApellido.getText().toString().isEmpty() &&
                !inputCodigo.getText().toString().isEmpty() &&
                !inputFacultad.getText().toString().isEmpty() &&
                !inputEspecialidad.getText().toString().isEmpty();
    }

    private void pedirPermisoYRegistrar() {
        if (ActivityCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
            ActivityCompat.requestPermissions(this,
                    new String[]{Manifest.permission.ACCESS_FINE_LOCATION},
                    CODIGO_PERMISO_UBICACION);
        } else {
            registrarAsistenciaConUbicacion();
        }
    }

    private void registrarAsistenciaConUbicacion() {
        fusedLocationClient.getLastLocation()
                .addOnSuccessListener(this, location -> {
                    if (location != null) {
                        double latitud = location.getLatitude();
                        double longitud = location.getLongitude();
                        textUbicacion.setText("Lat: " + latitud + " / Lon: " + longitud);

                        String codigo = inputCodigo.getText().toString();
                        String timestamp = String.valueOf(System.currentTimeMillis());
                        String fecha = new SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(new Date());
                        String hora = new SimpleDateFormat("HH:mm:ss", Locale.getDefault()).format(new Date());

                        DatabaseReference ref = databaseReference.child(codigo).child(timestamp);
                        ref.child("nombre").setValue(inputNombre.getText().toString());
                        ref.child("apellido").setValue(inputApellido.getText().toString());
                        ref.child("codigo").setValue(codigo);
                        ref.child("facultad").setValue(inputFacultad.getText().toString());
                        ref.child("especialidad").setValue(inputEspecialidad.getText().toString());
                        ref.child("latitud").setValue(latitud);
                        ref.child("longitud").setValue(longitud);
                        ref.child("fecha").setValue(fecha);
                        ref.child("hora").setValue(hora);

                        Toast.makeText(this, "Asistencia registrada", Toast.LENGTH_SHORT).show();
                    } else {
                        Toast.makeText(this, "No se pudo obtener la ubicación", Toast.LENGTH_SHORT).show();
                    }
                });
    }

    @Override
    public void onRequestPermissionsResult(int requestCode,
                                           @NonNull String[] permissions,
                                           @NonNull int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == CODIGO_PERMISO_UBICACION &&
                grantResults.length > 0 &&
                grantResults[0] == PackageManager.PERMISSION_GRANTED) {
            registrarAsistenciaConUbicacion();
        } else {
            Toast.makeText(this, "Permiso denegado", Toast.LENGTH_SHORT).show();
        }
    }
}

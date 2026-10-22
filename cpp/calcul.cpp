// Module de calcul du projet "Gestion des notes".
// Appelé par le serveur Node.js : le mode est lu sur la 1re ligne de stdin,
// les données sur les lignes suivantes (champs séparés par ';').
//
//   moyennes   : lignes "idx;note;coef"   -> "idx;sommePonderee;sommeCoef;moyenne;observation"
//   classement : lignes "idx;moyenne"     -> "rang;idx;moyenne"   (ordre décroissant)
//   stats      : lignes "moyenne"         -> "admis;redoublant;exclus;total"
//
// Règles : ADMIS si moyenne >= 10, REDOUBLANT si 7.5 <= moyenne < 10, EXCLUS si moyenne < 7.5.
// La moyenne est arrondie à 2 décimales avant de déterminer l'observation.

#include <algorithm>
#include <cmath>
#include <iomanip>
#include <iostream>
#include <map>
#include <sstream>
#include <string>
#include <vector>

using namespace std;

static double arrondi2(double x) { return round(x * 100.0) / 100.0; }

static const char* observation(double moyenne) {
    if (moyenne >= 10.0) return "ADMIS";
    if (moyenne >= 7.5) return "REDOUBLANT";
    return "EXCLUS";
}

static string trim(const string& s) {
    size_t a = s.find_first_not_of(" \t\r\n");
    if (a == string::npos) return "";
    size_t b = s.find_last_not_of(" \t\r\n");
    return s.substr(a, b - a + 1);
}

static vector<string> split(const string& s, char sep) {
    vector<string> parts;
    string cur;
    stringstream ss(s);
    while (getline(ss, cur, sep)) parts.push_back(cur);
    return parts;
}

static int modeMoyennes() {
    vector<long> ordre;
    map<long, pair<double, double>> acc;  // idx -> (somme pondérée, somme coef)
    string line;
    while (getline(cin, line)) {
        line = trim(line);
        if (line.empty()) continue;
        vector<string> p = split(line, ';');
        if (p.size() < 3) continue;
        long idx = stol(p[0]);
        double note = stod(p[1]);
        double coef = stod(p[2]);
        if (!acc.count(idx)) ordre.push_back(idx);
        acc[idx].first += note * coef;
        acc[idx].second += coef;
    }
    cout << fixed << setprecision(2);
    for (long idx : ordre) {
        double sp = acc[idx].first, sc = acc[idx].second;
        double m = sc > 0 ? arrondi2(sp / sc) : 0.0;
        cout << idx << ';' << arrondi2(sp) << ';' << arrondi2(sc) << ';' << m << ';'
             << observation(m) << '\n';
    }
    return 0;
}

static int modeClassement() {
    vector<pair<long, double>> items;
    string line;
    while (getline(cin, line)) {
        line = trim(line);
        if (line.empty()) continue;
        vector<string> p = split(line, ';');
        if (p.size() < 2) continue;
        items.push_back({stol(p[0]), stod(p[1])});
    }
    vector<pair<long, double>> tri = items;
    stable_sort(tri.begin(), tri.end(),
                [](const pair<long, double>& a, const pair<long, double>& b) {
                    return a.second > b.second;
                });
    cout << fixed << setprecision(2);
    for (const auto& it : tri) {
        int rang = 1;  // classement "à égalité" : rang = 1 + nombre de moyennes strictement supérieures
        for (const auto& other : items)
            if (other.second > it.second) rang++;
        cout << rang << ';' << it.first << ';' << it.second << '\n';
    }
    return 0;
}

static int modeStats() {
    long admis = 0, redoublant = 0, exclus = 0;
    string line;
    while (getline(cin, line)) {
        line = trim(line);
        if (line.empty()) continue;
        double m = stod(line);
        string o = observation(m);
        if (o == "ADMIS") admis++;
        else if (o == "REDOUBLANT") redoublant++;
        else exclus++;
    }
    cout << admis << ';' << redoublant << ';' << exclus << ';' << (admis + redoublant + exclus)
         << '\n';
    return 0;
}

int main() {
    ios::sync_with_stdio(false);
    string mode;
    if (!getline(cin, mode)) return 2;
    mode = trim(mode);
    try {
        if (mode == "moyennes") return modeMoyennes();
        if (mode == "classement") return modeClassement();
        if (mode == "stats") return modeStats();
    } catch (const exception& e) {
        cerr << "Entree invalide : " << e.what() << '\n';
        return 2;
    }
    cerr << "Mode inconnu : " << mode << '\n';
    return 1;
}

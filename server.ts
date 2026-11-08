import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from './server/db.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // --- API ROUTES ---

  // Health check
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Settings
  app.get('/api/settings', (req: Request, res: Response) => {
    try {
      res.json(db.getSettings());
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put('/api/settings', (req: Request, res: Response) => {
    try {
      const auteur = (req.headers['x-user-name'] as string) || 'Administrateur';
      const updated = db.updateSettings(req.body, auteur);
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Reset demo
  app.post('/api/demo/reset', (req: Request, res: Response) => {
    try {
      const result = db.resetDemoData();
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Employees
  app.get('/api/employees', (req: Request, res: Response) => {
    try {
      const list = db.getEmployes({
        search: req.query.search as string,
        direction: req.query.direction as string,
        sexe: req.query.sexe as string,
        categorie: req.query.categorie as string,
      });
      res.json(list);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/employees/:matricule', (req: Request, res: Response) => {
    try {
      const emp = db.getEmployeByMatricule(req.params.matricule);
      if (!emp) {
        return res.status(404).json({ error: 'Employé non trouvé' });
      }
      res.json(emp);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/employees', (req: Request, res: Response) => {
    try {
      const auteur = (req.headers['x-user-name'] as string) || 'Administrateur';
      const newEmp = db.addEmploye(req.body, auteur);
      res.status(201).json(newEmp);
    } catch (err: any) {
      if (err.message === 'Employé déjà enregistré') {
        return res.status(409).json({ error: err.message });
      }
      res.status(400).json({ error: err.message });
    }
  });

  app.put('/api/employees/:id', (req: Request, res: Response) => {
    try {
      const auteur = (req.headers['x-user-name'] as string) || 'Administrateur';
      const updated = db.updateEmploye(req.params.id, req.body, auteur);
      res.json(updated);
    } catch (err: any) {
      if (err.message === 'Employé déjà enregistré') {
        return res.status(409).json({ error: err.message });
      }
      if (err.message === 'Employé non trouvé') {
        return res.status(404).json({ error: err.message });
      }
      res.status(400).json({ error: err.message });
    }
  });

  app.delete('/api/employees/:id', (req: Request, res: Response) => {
    try {
      const auteur = (req.headers['x-user-name'] as string) || 'Administrateur';
      const result = db.deleteEmploye(req.params.id, auteur);
      res.json(result);
    } catch (err: any) {
      if (err.message === 'Employé non trouvé') {
        return res.status(404).json({ error: err.message });
      }
      // If employee has leave requests, return 400 constraint error
      res.status(400).json({ error: err.message });
    }
  });

  // Leave Types
  app.get('/api/leave-types', (req: Request, res: Response) => {
    try {
      const list = db.getTypesConge(req.query.search as string);
      res.json(list);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/leave-types', (req: Request, res: Response) => {
    try {
      const auteur = (req.headers['x-user-name'] as string) || 'Administrateur';
      const created = db.addTypeConge(req.body, auteur);
      res.status(201).json(created);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.put('/api/leave-types/:id', (req: Request, res: Response) => {
    try {
      const auteur = (req.headers['x-user-name'] as string) || 'Administrateur';
      const updated = db.updateTypeConge(req.params.id, req.body, auteur);
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.delete('/api/leave-types/:id', (req: Request, res: Response) => {
    try {
      const auteur = (req.headers['x-user-name'] as string) || 'Administrateur';
      const result = db.deleteTypeConge(req.params.id, auteur);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Leave Requests
  app.get('/api/requests', (req: Request, res: Response) => {
    try {
      const list = db.getDemandes({
        matricule: req.query.matricule as string,
        search: req.query.search as string,
        direction: req.query.direction as string,
        annee: req.query.annee ? Number(req.query.annee) : undefined,
        codeType: req.query.codeType as string,
        statut: req.query.statut as string,
      });
      res.json(list);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/requests/:id', (req: Request, res: Response) => {
    try {
      const item = db.getDemandeById(req.params.id);
      if (!item) {
        return res.status(404).json({ error: 'Demande non trouvée' });
      }
      res.json(item);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/requests', (req: Request, res: Response) => {
    try {
      const auteur = (req.headers['x-user-name'] as string) || 'Employé';
      const created = db.createDemande(req.body, auteur);
      res.status(201).json(created);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.put('/api/requests/:id', (req: Request, res: Response) => {
    try {
      const auteur = (req.headers['x-user-name'] as string) || 'Gestionnaire RH';
      const updated = db.updateDemande(req.params.id, req.body, auteur);
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.delete('/api/requests/:id', (req: Request, res: Response) => {
    try {
      const auteur = (req.headers['x-user-name'] as string) || 'Gestionnaire RH';
      const result = db.deleteDemande(req.params.id, auteur);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Validation / Rejection route with strict balance enforcement
  app.post('/api/requests/:id/validate', (req: Request, res: Response) => {
    try {
      const { action, validePar, observation } = req.body;
      if (!action || !['ACCORDER', 'REFUSER'].includes(action)) {
        return res.status(400).json({ error: 'Action invalide (ACCORDER ou REFUSER attendu)' });
      }

      const result = db.processValidation(
        req.params.id,
        action,
        validePar || 'Responsable RH',
        observation
      );
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Individual recap sheet
  app.get('/api/recap/:matricule/:annee', (req: Request, res: Response) => {
    try {
      const recap = db.getSoldeRecapForEmployee(
        req.params.matricule,
        Number(req.params.annee)
      );
      res.json(recap);
    } catch (err: any) {
      if (err.message === 'Employé non trouvé') {
        return res.status(404).json({ error: err.message });
      }
      res.status(500).json({ error: err.message });
    }
  });

  // All balances summary
  app.get('/api/balances/all/:annee', (req: Request, res: Response) => {
    try {
      const result = db.getAllBalances(Number(req.params.annee), {
        direction: req.query.direction as string,
        categorie: req.query.categorie as string,
        search: req.query.search as string,
      });
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Statistics and Dashboard
  app.get('/api/stats/dashboard', (req: Request, res: Response) => {
    try {
      const stats = db.getDashboardStats({
        annee: req.query.annee ? Number(req.query.annee) : undefined,
        direction: req.query.direction as string,
        categorie: req.query.categorie as string,
      });
      res.json(stats);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Absenteeism Ranking
  app.get('/api/stats/absenteeism', (req: Request, res: Response) => {
    try {
      const ranking = db.getAbsenteeismRanking({
        annee: req.query.annee ? Number(req.query.annee) : undefined,
        direction: req.query.direction as string,
        categorie: req.query.categorie as string,
      });
      res.json(ranking);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Audit logs
  app.get('/api/audit-logs', (req: Request, res: Response) => {
    try {
      res.json(db.getAuditLogs());
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Vite Integration in Development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`GESTION RH Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

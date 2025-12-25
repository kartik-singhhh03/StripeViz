import { RequestHandler } from "express";
import { simulateWhatIf, WhatIfInput } from "../lib/insights-engine";
import { WhatIfScenario, WhatIfResult } from "@shared/api";

/**
 * POST /api/whatif/simulate
 * 
 * Simulates what-if scenarios for business projections
 */
export const handleWhatIfSimulation: RequestHandler = async (req, res) => {
  try {
    const { baseData, scenario } = req.body as {
      baseData: WhatIfInput;
      scenario: WhatIfScenario;
    };

    // Validate input
    if (!baseData || !scenario) {
      res.status(400).json({ error: 'Missing baseData or scenario' });
      return;
    }

    // Validate baseData fields
    if (
      typeof baseData.currentMRR !== 'number' ||
      typeof baseData.currentChurnRate !== 'number' ||
      typeof baseData.currentARPU !== 'number' ||
      typeof baseData.currentCustomers !== 'number'
    ) {
      res.status(400).json({ error: 'Invalid baseData format' });
      return;
    }

    // Run simulation
    const result = simulateWhatIf(baseData, scenario);

    res.json(result);
  } catch (error) {
    console.error('What-If simulation error:', error);
    res.status(500).json({ error: 'Simulation failed' });
  }
};

/**
 * POST /api/whatif/batch
 * 
 * Simulates multiple scenarios at once
 */
export const handleBatchWhatIfSimulation: RequestHandler = async (req, res) => {
  try {
    const { baseData, scenarios } = req.body as {
      baseData: WhatIfInput;
      scenarios: WhatIfScenario[];
    };

    if (!baseData || !scenarios || !Array.isArray(scenarios)) {
      res.status(400).json({ error: 'Missing baseData or scenarios array' });
      return;
    }

    if (scenarios.length > 10) {
      res.status(400).json({ error: 'Maximum 10 scenarios per batch' });
      return;
    }

    const results: WhatIfResult[] = scenarios.map(scenario => 
      simulateWhatIf(baseData, scenario)
    );

    res.json({ results });
  } catch (error) {
    console.error('Batch What-If simulation error:', error);
    res.status(500).json({ error: 'Batch simulation failed' });
  }
};

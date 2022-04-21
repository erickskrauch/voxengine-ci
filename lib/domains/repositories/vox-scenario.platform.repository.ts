import { APIErrorCode } from '@voximplant/apiclient-nodejs/dist/Enums';
import { ScenarioInfo } from '@voximplant/apiclient-nodejs/dist/Structures';

import { VoximplantContext } from '../contexts/voximplant.context';
import { isApiErrorResponse } from '../types/api-error-response.type';
import { BindScenarioRequest } from '@voximplant/apiclient-nodejs/dist/Interfaces';
import { LogMessageGeneratorFactory } from '../../utils/logMessageGenerator';

export class VoxScenarioPlatformRepository {
  private lmg = LogMessageGeneratorFactory.getInstance();

  constructor(public context: VoximplantContext) {}

  init = () => {
    console.info(
      this.lmg.generate('INFO__INIT_SUCCESS', this.constructor.name),
    );
  };

  downloadScenarios = async (): Promise<ScenarioInfo[]> => {
    const response = await this.context.client.Scenarios.getScenarios({});
    if (isApiErrorResponse(response)) {
      throw new Error(
        this.lmg.generate(
          'ERR__VOXIMPLANT_API_ERROR',
          APIErrorCode[response.error.code],
        ),
      );
    }
    if (response.totalCount === 0) return [];
    const { result } = await this.context.client.Scenarios.getScenarios({
      count: response.totalCount,
    });
    console.info(this.lmg.generate('INFO__SCENARIOS_DOWNLOADED'));
    return result;
  };

  downloadScenarioById = async (scenarioId: number): Promise<ScenarioInfo> => {
    const response = await this.context.client.Scenarios.getScenarios({
      scenarioId,
      withScript: true,
    });
    if (isApiErrorResponse(response)) {
      throw new Error(
        this.lmg.generate(
          'ERR__VOXIMPLANT_API_ERROR',
          APIErrorCode[response.error.code],
        ),
      );
    }
    const scenarioInfo: ScenarioInfo = response.result[0];
    if (!scenarioInfo) {
      console.error(
        this.lmg.generate(
          'ERR__CANNOT_DOWNLOAD_SCENARIO_BY_ID',
          scenarioId.toString(),
        ),
      );
      return;
    }
    console.info(
      this.lmg.generate(
        'INFO__SCENARIO_BY_ID_DOWNLOADED',
        scenarioId.toString(),
      ),
    );
    return scenarioInfo;
  };

  downloadScenarioByName = async (
    scenarioName: string,
  ): Promise<ScenarioInfo> => {
    const response = await this.context.client.Scenarios.getScenarios({
      scenarioName,
      withScript: true,
    });
    if (isApiErrorResponse(response)) {
      throw new Error(
        this.lmg.generate(
          'ERR__VOXIMPLANT_API_ERROR',
          APIErrorCode[response.error.code],
        ),
      );
    }
    const scenarioId: number = response.result[0]?.scenarioId;
    if (!scenarioId) {
      console.error(
        this.lmg.generate(
          'ERR__CANNOT_DOWNLOAD_SCENARIO_BY_NAME',
          scenarioName,
        ),
      );
      return;
    }
    const scenarioInfo: ScenarioInfo = await this.downloadScenarioById(
      scenarioId,
    );
    console.info(
      this.lmg.generate('INFO__SCENARIO_BY_NAME_DOWNLOADED', scenarioName),
    );
    return scenarioInfo;
  };

  // TODO: Reorder scenarios feature need be implemented
  // await this.context.client.Scenarios.reorderScenarios({...});

  addScenario = async (
    scenarioName: string,
    scenarioScript: string,
  ): Promise<number> => {
    try {
      const getScenarioResponse =
        await this.context.client.Scenarios.getScenarios({
          scenarioName,
        });
      if (isApiErrorResponse(getScenarioResponse)) {
        throw new Error(
          this.lmg.generate(
            'ERR__VOXIMPLANT_API_ERROR',
            APIErrorCode[getScenarioResponse.error.code],
          ),
        );
      }
      const scenariosInfo: ScenarioInfo[] = getScenarioResponse.result;
      const scenarioInfo = scenariosInfo[0];
      if (scenarioInfo) {
        throw new Error(
          this.lmg.generate('ERR__SCENARIO_ALREADY_EXISTS', scenarioName),
        );
      }
      const { result, scenarioId } =
        await this.context.client.Scenarios.addScenario({
          scenarioName,
          scenarioScript,
        });
      if (!result) {
        throw new Error(
          this.lmg.generate('ERR__CANNOT_ADD_SCENARIO', scenarioName),
        );
      }
      console.info(this.lmg.generate('INFO__SCENARIO_ADDED', scenarioName));
      return scenarioId;
    } catch (error) {
      console.error(
        this.lmg.generate('ERR__ADD_SCENARIO_FAILED', this.constructor.name),
      );
      console.error(error);
    }
  };

  updateScenario = async (
    scenarioId: number,
    scenarioName: string,
    scenarioScript: string,
  ): Promise<number> => {
    try {
      const response = await this.context.client.Scenarios.setScenarioInfo({
        scenarioId,
        requiredScenarioName: scenarioName,
        scenarioScript,
      });
      if (isApiErrorResponse(response)) {
        throw new Error(
          this.lmg.generate(
            'ERR__VOXIMPLANT_API_ERROR',
            APIErrorCode[response.error.code],
          ),
        );
      }
      const { result } = response;
      if (!result) {
        throw new Error(
          this.lmg.generate(
            'ERR__CANNOT_UPDATE_SCENARIO',
            scenarioName,
            scenarioId.toString(),
          ),
        );
      }
      console.info(
        this.lmg.generate(
          'INFO__SCENARIO_UPDATED',
          scenarioId.toString(),
          scenarioName,
        ),
      );
      return result;
    } catch (error) {
      console.error(
        this.lmg.generate('ERR__UPDATE_SCENARIO_FAILED', this.constructor.name),
      );
      console.error(error);
    }
  };

  bindScenarios = async (bindScenarioRequest: BindScenarioRequest) => {
    try {
      const response = await this.context.client.Scenarios.bindScenario(
        bindScenarioRequest,
      );
      const { scenarioId, scenarioName, ruleName } = bindScenarioRequest;
      if (bindScenarioRequest.bind) {
        console.info(
          this.lmg.generate(
            'INFO__SCENARIOS_BOUND',
            scenarioId.toString(),
            scenarioName.toString(),
            ruleName,
          ),
        );
      }
      if (!bindScenarioRequest.bind) {
        console.info(
          this.lmg.generate(
            'INFO__SCENARIOS_DETACHED',
            scenarioId.toString(),
            scenarioName.toString(),
            ruleName,
          ),
        );
      }
      return response;
    } catch (error) {
      console.error(
        this.lmg.generate('ERR__BIND_SCENARIO_FAILED', this.constructor.name),
      );
      console.error(error);
    }
  };
}

/*
 *
 *  Copyright 2019 InfAI (CC SES)
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

import {Component, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {DesignerProcessModel} from '../../designer/shared/designer.model';
import {
    DeploymentsPreparedElementModel,
    DeploymentsPreparedLaneElementModel,
    DeploymentsPreparedLaneModel,
    DeploymentsPreparedLaneSubElementModel, DeploymentsPreparedLaneTaskElementModel,
    DeploymentsPreparedModel,
    DeploymentsPreparedSelectableModel,
    DeploymentsPreparedSelectionModel,
    DeploymentsPreparedTaskModel
} from '../shared/deployments-prepared.model';
import {ProcessRepoService} from '../../process-repo/shared/process-repo.service';
import {DeploymentsService} from '../shared/deployments.service';
import {UtilService} from '../../../../core/services/util.service';
import {FormArray, FormBuilder, FormControl, FormGroup, Validators} from '@angular/forms';
import {DeviceTypeServiceModel} from '../../../devices/device-types-overview/shared/device-type.model';
import {DeviceInstancesUpdateModel} from '../../../devices/device-instances/shared/device-instances-update.model';


@Component({
    selector: 'senergy-process-deployments-config',
    templateUrl: './deployments-config.component.html',
    styleUrls: ['./deployments-config.component.css']
})

export class ProcessDeploymentsConfigComponent implements OnInit {

    processId = '';
    deployment: DeploymentsPreparedModel | null = null;
    deploymentFormGroup!: FormGroup;

    constructor(private _formBuilder: FormBuilder,
                private route: ActivatedRoute,
                private processRepoService: ProcessRepoService,
                private utilService: UtilService,
                private deploymentsService: DeploymentsService) {
    }

    ngOnInit() {
        this.processId = this.route.snapshot.paramMap.get('id') || '';
        this.deploy();
    }

    deploy(): void {
        this.deploymentsService.getPreparedDeployments(this.processId).subscribe((deployment: DeploymentsPreparedModel | null) => {
            if (deployment !== null) {
                this.deployment = deployment;
                this.initElementsFormArray();
            }
        });
    }

    initElementsFormArray(): void {


        if (this.deployment !== null) {

            this.deploymentFormGroup = this._formBuilder.group({
                elements: this.initElementsArray(this.deployment.elements),
                id: this.deployment.id,
                lanes: this.initLanesArray(this.deployment.lanes),
                name: this.deployment.name,
                svg: this.deployment.svg,
                xml: this.deployment.xml,
                xml_raw: this.deployment.xml_raw
            });

        }
    }

    initElementsArray(elements: DeploymentsPreparedElementModel[]): FormArray {
        const array = new FormArray([]);
        if (elements) {
            elements.forEach((el: DeploymentsPreparedElementModel) => {
                array.push(this.initElementFormGroup(el));
            });
        }
        return array;
    }

    initLanesArray(elements: DeploymentsPreparedLaneElementModel[]): FormArray {
        const array = new FormArray([]);
        if (elements) {
            elements.forEach((el: DeploymentsPreparedLaneElementModel) => {
                array.push(this.initLaneFormGroup(el));
            });
        }
        return array;
    }

    initElementFormGroup(element: DeploymentsPreparedElementModel): FormGroup {
        return this._formBuilder.group({
            order: [element.order],
            task: element.task ? this.initTaskFormGroup(element.task) : null
        });
    }

    initLaneFormGroup(laneElement: DeploymentsPreparedLaneElementModel): FormGroup {
        return this._formBuilder.group({
            order: [laneElement.order],
            lane: this.initLaneGroup(laneElement.lane),
        });
    }

    initLaneGroup(lane: DeploymentsPreparedLaneModel): FormGroup {
        return this._formBuilder.group({
            label: [lane.label],
            bpmn_element_id: [lane.bpmn_element_id],
            device_description: [lane.device_descriptions],
            selectables: this.initSelectablesFormArray(lane.selectables),
            selection: this.initLaneSelectionFormGroup(lane.selection),
            elements: this.initLaneElementFormArray(lane.elements),
        });
    }

    initTaskFormGroup(task: DeploymentsPreparedTaskModel): FormGroup {
        return this._formBuilder.group({
            label: [task.label],
            device_description: [task.device_description],
            bpmn_element_id: [task.bpmn_element_id],
            input: [task.input],
            selectables: this.initSelectablesFormArray(task.selectables),
            selection: this.initSelectionFormGroup(task.selection),
            selectableIndex: [task.selectableIndex],
            parameter: this.initParameterFormGroup(task.parameter),
            retries: [task.retries]
        });
    }

    initSelectionFormGroup(selection: DeploymentsPreparedSelectionModel): FormGroup {
        return this._formBuilder.group({
            device: [selection.device],
            service: [{value: selection.service, disabled: false}],
            show: [{value: false}]
        });
    }

    initLaneSelectionFormGroup(selection: DeviceInstancesUpdateModel): FormGroup {
        return this._formBuilder.group({
            id: [selection.id],
            device_type_id: [selection.device_type_id],
            local_id: [selection.local_id],
            name: [selection.name],
        });
    }

    initParameterFormGroup(parameter: any): FormGroup {
        const fbGroup = this._formBuilder.group({});
        for (const [key, value] of Object.entries(parameter)) {
            fbGroup.addControl(key, new FormControl(value));
        }
        return fbGroup;
    }

    initSelectablesFormArray(selectables: DeploymentsPreparedSelectableModel[]): FormArray {
        const array: FormGroup[] = [];

        if (selectables !== null) {
            selectables.forEach((selectable: DeploymentsPreparedSelectableModel) => {
                array.push(this.initDeviceServicesGroup(selectable));
            });
        }

        return this._formBuilder.array(array);
    }

    trackByFn(index: any) {
        return index;
    }

    initDeviceServicesGroup(selectable: DeploymentsPreparedSelectableModel): FormGroup {
        return this._formBuilder.group({
            device: [selectable.device],
            services: [selectable.services]
        });
    }


    save(): void {
        this.deploymentsService.postDeployments(this.deploymentFormGroup.value).subscribe((resp: any) => {
            console.log(resp);
        });
    }

    changeTaskSelectables(elementIndex: number, selectableIndex: number): void {
        const task = <FormGroup>this.deploymentFormGroup.get(['elements', elementIndex, 'task']);
        const selection = <FormGroup>this.deploymentFormGroup.get(['elements', elementIndex, 'task', 'selection']);
        const services = <FormArray>this.deploymentFormGroup.get(['elements', elementIndex, 'task', 'selectables', selectableIndex, 'services']);
        task.patchValue({'selectableIndex': selectableIndex});
        if (services.value.length <= 1) {
            selection.patchValue({'service': services.value[0]});
            selection.patchValue({'show': false});
        } else {
            selection.patchValue({'service': []});
            selection.patchValue({'show': true});
        }
    }

    changeLaneSelectables(lanesIndex: number, selectableIndex: number): void {
        const selectables = <FormGroup>this.deploymentFormGroup.get(['lanes', lanesIndex, 'lane', 'selectables', selectableIndex]);
        const selection = <FormGroup>this.deploymentFormGroup.get(['lanes', lanesIndex, 'lane', 'selection']);
        selection.setValue(selectables.value.device);
    }

    private initLaneElementFormArray(elements: DeploymentsPreparedLaneSubElementModel[]): FormArray {
        const array: FormGroup[] = [];
        if (elements !== null) {
            elements.forEach((element: DeploymentsPreparedLaneSubElementModel) => {
                array.push(this.initLaneElementGroup(element));
            });
        }
        return this._formBuilder.array(array);
    }

    private initLaneElementGroup(element: DeploymentsPreparedLaneSubElementModel): FormGroup {
        return this._formBuilder.group({
            order: [element.order],
            task: [element.task],
            msg_event: [element.msg_event],
            receive_task_event: [element.receive_task_event],
            time_event: [element.time_event],
        });
    }
}

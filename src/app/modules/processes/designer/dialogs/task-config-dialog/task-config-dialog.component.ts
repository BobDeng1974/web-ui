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

import {Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef, MatRadioChange} from '@angular/material';
import {FormBuilder, FormControl} from '@angular/forms';
import {
    DeviceTypeAspectModel,
    DeviceTypeDeviceClassModel, DeviceTypeFunctionModel, DeviceTypeFunctionType, functionTypes,
} from '../../../../devices/device-types-overview/shared/device-type.model';
import {
    DeviceTypeSelectionRefModel,
    DeviceTypeSelectionResultModel
} from '../../../../devices/device-types-overview/shared/device-type-selection.model';
import {DeviceTypeService} from '../../../../devices/device-types-overview/shared/device-type.service';

@Component({
    templateUrl: './task-config-dialog.component.html',
    styleUrls: ['./task-config-dialog.component.css'],
})
export class TaskConfigDialogComponent implements OnInit {
    optionsFormControl = new FormControl('');
    deviceClassFormControl = new FormControl('');
    aspectFormControl = new FormControl('');
    functionFormControl = new FormControl({value: '', disabled: true});
    completionStrategyFormControl = new FormControl('');

    deviceClasses: DeviceTypeDeviceClassModel[] = [];
    aspects: DeviceTypeAspectModel[] = [];
    functions: DeviceTypeFunctionModel[] = [];
    completionStrategy = '';
    limit = 20;

    result!: DeviceTypeSelectionResultModel;
    selection: DeviceTypeSelectionRefModel | null;
    functionTypes: DeviceTypeFunctionType[] = functionTypes;

    constructor(
        private dialogRef: MatDialogRef<TaskConfigDialogComponent>,
        private dtService: DeviceTypeService,
        private _formBuilder: FormBuilder,
        private deviceTypeService: DeviceTypeService,
        @Inject(MAT_DIALOG_DATA) private data: { selection: DeviceTypeSelectionRefModel | null }) {
        this.selection = this.data.selection;
    }

    ngOnInit() {
        this.initSelection();
        this.initOptions();
        this.getDeviceClasses();
        this.getAspects();
        this.initFunctions();
        this.initCompletionStrategy();

    }

    close(): void {
        this.dialogRef.close();
    }

    save(): void {
        this.result = {
            aspect: this.aspectFormControl.value,
            function: this.functionFormControl.value,
            device_class: this.deviceClassFormControl.value,
            skeleton: {},
            completionStrategy: this.completionStrategyFormControl.value
        };
        this.dialogRef.close(this.result);
    }

    compare(a: any, b: any): boolean {
        return a && b && a.id === b.id && a.name === b.name;
    }

    private initOptions(): void {
        this.optionsFormControl.valueChanges.subscribe(() => {
            this.deviceClassFormControl.setValue('');
            this.aspectFormControl.setValue('');
            this.functionFormControl.setValue('');
            this.functionFormControl.disable();
        });
    }

    private initCompletionStrategy(): void {

    }

    private getDeviceClasses(): void {
        this.deviceTypeService.getDeviceClasses().subscribe(
            (deviceTypeDeviceClasses: DeviceTypeDeviceClassModel[]) => {
                this.deviceClasses = deviceTypeDeviceClasses;
            });
    }

    private getAspects(): void {
        this.deviceTypeService.getAspects().subscribe(
            (aspects: DeviceTypeAspectModel[]) => {
                this.aspects = aspects;
            });
    }

    private initFunctions(): void {
        this.deviceClassFormControl.valueChanges.subscribe((deviceClass: DeviceTypeDeviceClassModel) => {
            this.resetFunctions();
            this.getDeviceClassFunctions(deviceClass);
        });

        this.aspectFormControl.valueChanges.subscribe((aspect: DeviceTypeAspectModel) => {
            this.resetFunctions();
            this.getAspectFunctions(aspect);
        });
    }

    private getAspectFunctions(aspect: DeviceTypeAspectModel) {
        this.deviceTypeService.getAspectsMeasuringFunctions(aspect.id).subscribe((functions: DeviceTypeFunctionModel[]) => {
            this.functions = functions;
        });
    }

    private getDeviceClassFunctions(deviceClass: DeviceTypeDeviceClassModel) {
        this.deviceTypeService.getDeviceClassesControllingFunctions(deviceClass.id).subscribe((functions: DeviceTypeFunctionModel[]) => {
            this.functions = functions;
        });
    }

    private resetFunctions() {
        this.functions = [];
        this.functionFormControl.setValue('');
        this.functionFormControl.enable();
    }

    private initSelection() {
        if (this.selection !== null) {
            this.deviceClassFormControl.setValue(this.selection.device_class);
            this.aspectFormControl.setValue(this.selection.aspect);
            this.functionTypes.forEach((functionType: DeviceTypeFunctionType) => {
                if (this.selection !== null && functionType.rdf_type === this.selection.function.rdf_type) {
                    this.optionsFormControl.setValue(functionType.text);
                    if (functionType.text === 'Controlling') {
                        this.getDeviceClassFunctions(this.selection.device_class);
                    }
                    if (functionType.text === 'Measuring') {
                        this.getAspectFunctions(this.selection.aspect);
                    }
                }
            });
            this.functionFormControl.setValue(this.selection.function);
            this.functionFormControl.enable();
            this.completionStrategyFormControl.setValue(this.selection.completionStrategy);
        } else {
            this.optionsFormControl.setValue('Controlling');
            this.completionStrategyFormControl.setValue('optimistic');
        }
    }
}
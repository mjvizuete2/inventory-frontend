import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { ProductCategory } from '../../../../shared/interfaces/product-category';
import { CategoryService } from '../../../services/category.service';
import { ProductService } from '../../../services/product.service';

@Component({
  selector: 'app-categories-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSnackBarModule,
    MatTableModule
  ],
  templateUrl: './categories-list.component.html'
})
export class CategoriesListComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly categoryService = inject(CategoryService);
  private readonly productService = inject(ProductService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);

  readonly displayedColumns = ['name', 'description', 'actions'];
  readonly form = this.fb.nonNullable.group({
    id: [0],
    name: ['', [Validators.required, Validators.maxLength(120)]],
    description: ['']
  });

  categories: ProductCategory[] = [];

  ngOnInit(): void {
    this.loadCategories();
  }

  edit(category: ProductCategory): void {
    this.form.patchValue({
      id: category.id,
      name: category.name,
      description: category.description ?? ''
    });
  }

  reset(): void {
    this.form.reset({ id: 0, name: '', description: '' });
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const request$ = value.id
      ? this.categoryService.updateCategory(value.id, { name: value.name, description: value.description, active: true })
      : this.categoryService.createCategory({ name: value.name, description: value.description, active: true });

    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.snackBar.open('Categoría guardada.', 'Cerrar', { duration: 2500 });
        this.reset();
        this.loadCategories();
      },
      error: (error) => {
        this.snackBar.open(error.error?.message ?? 'No se pudo guardar la categoría.', 'Cerrar', { duration: 3000 });
      }
    });
  }

  remove(category: ProductCategory): void {
    this.categoryService.deleteCategory(category.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.snackBar.open('Categoría eliminada.', 'Cerrar', { duration: 2500 });
          this.loadCategories();
        },
        error: (error) => {
          this.snackBar.open(error.error?.message ?? 'No se pudo eliminar la categoría.', 'Cerrar', { duration: 3000 });
        }
      });
  }

  private loadCategories(): void {
    this.categoryService.getCategories()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((categories) => {
        this.categories = categories;
        this.productService.setCategories(categories);
      });
  }
}
